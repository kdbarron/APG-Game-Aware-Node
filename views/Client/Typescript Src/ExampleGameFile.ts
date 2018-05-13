/* Metadata Server Example

This is the metadata example's javascript client.

When the webpage (game.html) is opened, it will create a twitch video plugin and a
transparent HTML5 canvas on top of it, which is controlled by this code.

If the corresponding Unity game is running, set up correctly, and streaming to Twitch,
the webpage this client is embedded in will be recieving video of several towers flying
around in various curves while a drifting 3d camera watches them.

This client will, meanwhile, be receiving metadata about the contents of the streaming
video - specifically, it will be receiving screen space positional information about the
various towers as well as real time game logic statistics about them.

What this specific file does is perform some client logic and graphics rendering with that
metadata, over the video frame. Namely,

1) if the user's mouse is over one of the towers, that tower will be highlighted

2) if the user clicks on a highlight tower, the tower will have a target put over it that will
follow the tower in realtime.

3) If a tower is highlighted, some statistics will be displayed about it.

That's it!

SOME NOTES:

Change the field "forceChatIRCChannelName" in game.html to change which twitch video
stream the client watches.

make sure to open game.html in Chrome with the command line parameters
"--user-data-dir="C:/whatever" --disable-web-security"  The HTML5 app reads data out
of the twitch video plugin, which is normally a violation of the browser security model
(it is regarded as a cross site scripting issue.)
 
 */

// Pre-cache all of the assets we're going to use in this app.  We have to do this to make sure these assets
// around downloaded to clients before the app launches.

function CacheGameAssets(c: Cacher): void {
    c.images('assets', ['hudselect.png', 'TowerInformationPopup.png', 'background.png', 'HoverbuggyInformationPopup.png', 'HoverbossInformationPopup.png', 'HovercopterInformationPopup.png', 'HovertankInformationPopup.png', 'Rectangle.png']);
	c.sounds('assets', ['click.mp3']);
}

// These two interfaces are the parameters for network messages.  They'll be serialized into JSON and then trasmitted across the metadata server.
// The specific fields need to stay in sync (by both type and name) with the C# code.

interface ServerTower{
    x: number;
	y: number;
    scaleX: number;
    scaleY: number;
    attack: number;
    coolDown: number;
    fireRate: number;
    name: string;
}
interface ServerTowers{
	items: ServerTower[];
}

interface ServerEnemyInformation {
    enemyName: string;
    health: number;
    speed: number;
    attack: number;
}

interface ServerEnemyPosition {
    enemyName: string;
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
}

interface ServerEnemies {
    info: ServerEnemyInformation[];
    enemies: ServerEnemyPosition[];
    waveNumber: number;
}

interface ServerMessage {
    enemyInfo: ServerEnemies;
    towerInfo: ServerTowers;
}

function InitializeGame(apg: APGSys): void {

	// _____________________________________ SET SHARED APP VARIABLES _______________________________________

	var phaserGameWorld: Phaser.Group = apg.w;

	// This field will be the metadata sent down from the server for the current frame.  
	// When the user clicks the mouse, we'll pause before they're allowed to click the mouse again.
	var lastClickDelay: number = 0;

	// Register the clicking sound
	var clickSound: Phaser.Sound = apg.g.add.audio('assets/click.mp3', .4, false);


	// _____________________________________ MAKE GAME OBJECTS _______________________________________

	// This app has four main game objects, three of which use updated metadata to change what
	// graphics are drawn over the video frame.  There is a highlight that draws when a tower is
	// near the mouse cursor, there is a target that follows a tower if it has been selected, there
	// is a text label showing updating gameplay specific stats of the currently selected tower, and
	// there is a background under that text that obscures that visually jarring binary frame data
	// in the video stream.

    var serverMetadataForFrame: ServerMessage = null;
    var metadataForFrame: ServerTowers = null;
    var enemyMetadataForFrame: ServerEnemies = null;


    apg.ResetServerMessageRegistry();
    apg.Register<ServerMessage>("server", updatedMetadataForNewFrame => {
        // We register a simple callback that updates when the video frame has advanced and there is new metadata.
        // We will use this metadata in game object frame updates to change what is displayed in the overlay.
        // In theory, it would be more efficient to do the actual updating in this callback, but it's not a priority.
        serverMetadataForFrame = updatedMetadataForNewFrame;
        metadataForFrame = serverMetadataForFrame.towerInfo;
        enemyMetadataForFrame = serverMetadataForFrame.enemyInfo;
    });

    // #region Tower
    {
        // Index in the Servertowers array of the currently selected tower. 
        var towerID: number = 0;

        // _____ Mouse Highlighter _______

        // This is a highlight for the situation when the mouse cursor is roughly over one of the towers.
        // We will do the logic in this game object to see if the mouse is down, and if so, we will
        // target that tower, if one is highlighted, or untarget otherwise.

        /* Highlight Object */
        var towerMouseHighlight: Phaser.Sprite = new Phaser.Sprite(apg.g, 0, 0, 'assets/TowerInformationPopup.png');
        towerMouseHighlight.anchor = new Phaser.Point(0.4, 0.75);
        towerMouseHighlight.scale = new Phaser.Point(1, 1);
        towerMouseHighlight.update = () => {
            lastClickDelay--;
            if (metadataForFrame != null) {
                var overAtower: boolean = false;
                for (var k: number = 0; k < metadataForFrame.items.length; k++) {

                    //x = topleftX and y = topLeftY
                    var leftX: number = APGHelper.ScreenX(metadataForFrame.items[k].x);
                    var topY: number = APGHelper.ScreenY(metadataForFrame.items[k].y);

                    //scaleX = width and sccaleY = height
                    var rightX: number = APGHelper.ScreenX(metadataForFrame.items[k].scaleX + metadataForFrame.items[k].x);
                    var bottomY: number = APGHelper.ScreenY(metadataForFrame.items[k].y - metadataForFrame.items[k].scaleY);

                    // Test if our mouse is close to the screen space coordinates of the current tower.
                    // This test is simple and hard-coded for this demo.

                    if (apg.g.input.activePointer.x >= leftX && apg.g.input.activePointer.x <= rightX &&
                        apg.g.input.activePointer.y >= topY && apg.g.input.activePointer.y <= bottomY) {

                        // We are over a tower, so record its index.
                        overAtower = true;

                        // Center the highlight on this tower and make it visible.
                        towerMouseHighlight.x = leftX;
                        towerMouseHighlight.y = topY;
                        towerMouseHighlight.visible = true;

                        towerID = k;

                        /* display text and rectangles properly */
                        towerStatsText.text = metadataForFrame.items[towerID].name + "\nFIRE RATE \nATTACK";
                        towerStatsFireBar.scale = new Phaser.Point(metadataForFrame.items[towerID].fireRate * .5, 0.6);
                        towerStatsAttackBar.scale = new Phaser.Point(metadataForFrame.items[towerID].attack * .5, 0.6);
                    }
                }

                if (!overAtower) {
                    // The case where we are not over a tower.  Make the highlight invisible and turn off targeting
                    // if the mouse was clicked.
                    towerMouseHighlight.visible = false;
                    towerID = -1;
                    lastClickDelay = 20;
                }
            }
        }
        phaserGameWorld.addChild(towerMouseHighlight);

        /* Text in highlight object */
        var towerStatsText: Phaser.Text = new Phaser.Text(apg.g, -85, -85, "", { font: '12px Helvetica', fill: '#C0C0C0' });
        towerStatsText.update = () => { }
        towerMouseHighlight.addChild(towerStatsText);

        /* Rectangle representing the fire rate */
        var towerStatsFireBar: Phaser.Sprite = new Phaser.Sprite(apg.g, -10, -63, 'assets/Rectangle.png');
        towerStatsFireBar.scale = new Phaser.Point(0.6, 0.6);
        towerStatsFireBar.tint = 0xFF6961;
        towerStatsFireBar.update = () => {
            if (towerStatsFireBar.parent != towerMouseHighlight) {
                towerStatsFireBar.parent.removeChild(towerStatsFireBar);
                towerMouseHighlight.addChild(towerStatsFireBar);
            }
        }
        phaserGameWorld.addChild(towerStatsFireBar);

        /* Rectangle representing the attack rate */
        var towerStatsAttackBar: Phaser.Sprite = new Phaser.Sprite(apg.g, -10, -43, 'assets/Rectangle.png');
        towerStatsAttackBar.scale = new Phaser.Point(0.6, 0.6);
        towerStatsAttackBar.tint = 0xE6C76A;
        towerStatsAttackBar.update = () => {
            if (towerStatsAttackBar.parent != towerMouseHighlight) {
                towerStatsAttackBar.parent.removeChild(towerStatsAttackBar);
                towerMouseHighlight.addChild(towerStatsAttackBar);
            }
        }
        phaserGameWorld.addChild(towerStatsAttackBar);
    }
    // #endregion


    // #region Enemy
    {

        // Index in the Serverenemies array of the currently selected enemy.  We'll default to showing the first enemy.
        var enemyID: number = 0;

        var waveNumber: number = -1;
        var waveImages: Array<Phaser.Sprite> = new Array<Phaser.Sprite>();

        //parent graphic to contain enemy graphics
        var enemyInformationArea: Phaser.Sprite = new Phaser.Sprite(apg.g, 800, 75, 'assets/background.png');
        enemyInformationArea.anchor = new Phaser.Point(0, 0);
        enemyInformationArea.scale = new Phaser.Point(0.35, 0.9);
        enemyInformationArea.update = () => {

            if (enemyMetadataForFrame != null) {
                if (enemyMetadataForFrame.waveNumber != waveNumber) {

                    //remove previous level's enemy information
                    for (var i: number = 0; i < waveImages.length; i++) {
                        phaserGameWorld.removeChild(waveImages[i]);
                    }

                    //Create graphics of enemy information
                    for (var i: number = 0; i < enemyMetadataForFrame.info.length; i++) {
                        var enemyInformationPopup: Phaser.Sprite = new Phaser.Sprite(apg.g, enemyInformationArea.x + 20, i * 100 + enemyInformationArea.y + 20, 'assets/' + enemyMetadataForFrame.info[i].enemyName + 'InformationPopup.png');
                        phaserGameWorld.addChild(enemyInformationPopup);

                        var enemyInformationText: Phaser.Text = new Phaser.Text(apg.g, 100, 10, "", { font: '12px Helvetica', fill: '#C0C0C0' });
                        enemyInformationText.anchor = new Phaser.Point(0, 0);
                        enemyInformationText.text = enemyMetadataForFrame.info[i].enemyName + "\nHealth: \nSpeed: \nAttack:";
                        enemyInformationPopup.addChild(enemyInformationText);

                        /* Rectangle representing the health */
                        var enemyHealthBar: Phaser.Sprite = new Phaser.Sprite(apg.g, -10, -63, 'assets/Rectangle.png');
                        enemyHealthBar.scale = new Phaser.Point(0.6, 0.6);
                        enemyHealthBar.tint = 0xFF6961;
                        enemyHealthBar.update = () => {
                            if (enemyHealthBar.parent != enemyInformationPopup) {
                                enemyHealthBar.parent.removeChild(enemyHealthBar);
                                enemyInformationPopup.addChild(enemyHealthBar);
                            }
                        }
                        phaserGameWorld.addChild(enemyHealthBar);

                        /* Rectangle representing the speed */
                        var enemySpeedBar: Phaser.Sprite = new Phaser.Sprite(apg.g, -10, -43, 'assets/Rectangle.png');
                        enemySpeedBar.scale = new Phaser.Point(0.6, 0.6);
                        enemySpeedBar.tint = 0x3299ff;
                        enemySpeedBar.update = () => {
                            if (enemySpeedBar.parent != enemyInformationPopup) {
                                enemySpeedBar.parent.removeChild(enemySpeedBar);
                                enemyInformationPopup.addChild(enemySpeedBar);
                            }
                        }
                        phaserGameWorld.addChild(enemySpeedBar);

                        /* Rectangle representing the attack */
                        var enemyAttackBar: Phaser.Sprite = new Phaser.Sprite(apg.g, -10, -23, 'assets/Rectangle.png');
                        enemyAttackBar.scale = new Phaser.Point(0.6, 0.6);
                        enemyAttackBar.tint = 0xE6C76A;
                        enemyAttackBar.update = () => {
                            if (enemyAttackBar.parent != enemyInformationPopup) {
                                enemyAttackBar.parent.removeChild(enemyAttackBar);
                                enemyInformationPopup.addChild(enemyAttackBar);
                            }
                        }
                        phaserGameWorld.addChild(enemyAttackBar);

                        enemyInformationPopup.update = () => {
                            /* display text and rectangles properly */
                            if (enemyMetadataForFrame != null && enemyMetadataForFrame.info[i] != null) {
                                enemyHealthBar.scale = new Phaser.Point(enemyMetadataForFrame.info[i].health * .5, 0.6);
                                enemySpeedBar.scale = new Phaser.Point(enemyMetadataForFrame.info[i].speed * .5, 0.6);
                                enemyAttackBar.scale = new Phaser.Point(enemyMetadataForFrame.info[i].attack * .5, 0.6);
                            }
                        }

                        waveImages.push(enemyInformationPopup);
                    }

                    waveNumber = enemyMetadataForFrame.waveNumber;
                }
            }

        }
        phaserGameWorld.addChild(enemyInformationArea);
    }
    // #endregion
}