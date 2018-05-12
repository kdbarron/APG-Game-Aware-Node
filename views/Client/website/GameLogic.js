var APGHelper = (function () {
    function APGHelper() {
    }
    APGHelper.ScreenX = function (val) { return val / 10000 * 1024; };
    APGHelper.ScreenY = function (val) { return (1 - val / 10000) * (768 - 96 - 96); };
    return APGHelper;
}());
function CacheGameAssets(c) {
    c.images('assets', ['hudselect.png', 'TowerInformationPopup.png', 'background.png', 'HoverbuggyInformationPopup.png', 'HoverbossInformationPopup.png', 'HovercopterInformationPopup.png', 'HovertankInformationPopup.png', 'Rectangle.png']);
    c.sounds('assets', ['click.mp3']);
}
function InitializeGame(apg) {
    var phaserGameWorld = apg.w;
    var lastClickDelay = 0;
    var clickSound = apg.g.add.audio('assets/click.mp3', .4, false);
    var serverMetadataForFrame = null;
    var metadataForFrame = null;
    var enemyMetadataForFrame = null;
    apg.ResetServerMessageRegistry();
    apg.Register("server", function (updatedMetadataForNewFrame) {
        serverMetadataForFrame = updatedMetadataForNewFrame;
        metadataForFrame = serverMetadataForFrame.towerInfo;
        enemyMetadataForFrame = serverMetadataForFrame.enemyInfo;
    });
    {
        var towerID = 0;
        var towerMouseHighlight = new Phaser.Sprite(apg.g, 0, 0, 'assets/TowerInformationPopup.png');
        towerMouseHighlight.anchor = new Phaser.Point(0.4, 0.75);
        towerMouseHighlight.scale = new Phaser.Point(1, 1);
        towerMouseHighlight.update = function () {
            lastClickDelay--;
            if (metadataForFrame != null) {
                var overAtower = false;
                for (var k = 0; k < metadataForFrame.items.length; k++) {
                    var leftX = APGHelper.ScreenX(metadataForFrame.items[k].x);
                    var topY = APGHelper.ScreenY(metadataForFrame.items[k].y);
                    var rightX = APGHelper.ScreenX(metadataForFrame.items[k].scaleX + metadataForFrame.items[k].x);
                    var bottomY = APGHelper.ScreenY(metadataForFrame.items[k].y - metadataForFrame.items[k].scaleY);
                    if (apg.g.input.activePointer.x >= leftX && apg.g.input.activePointer.x <= rightX &&
                        apg.g.input.activePointer.y >= topY && apg.g.input.activePointer.y <= bottomY) {
                        overAtower = true;
                        towerMouseHighlight.x = leftX;
                        towerMouseHighlight.y = topY;
                        towerMouseHighlight.visible = true;
                        towerID = k;
                        towerStatsText.text = metadataForFrame.items[towerID].name + "\nFIRE RATE \nATTACK";
                        towerStatsFireBar.scale = new Phaser.Point(metadataForFrame.items[towerID].fireRate * 1.5, 0.6);
                        towerStatsAttackBar.scale = new Phaser.Point(metadataForFrame.items[towerID].attack * 1.5, 0.6);
                    }
                }
                if (!overAtower) {
                    towerMouseHighlight.visible = false;
                    towerID = -1;
                    lastClickDelay = 20;
                }
            }
        };
        phaserGameWorld.addChild(towerMouseHighlight);
        var towerStatsText = new Phaser.Text(apg.g, -85, -85, "", { font: '12px Helvetica', fill: '#C0C0C0' });
        towerStatsText.update = function () { };
        towerMouseHighlight.addChild(towerStatsText);
        var towerStatsFireBar = new Phaser.Sprite(apg.g, -10, -63, 'assets/Rectangle.png');
        towerStatsFireBar.scale = new Phaser.Point(0.6, 0.6);
        towerStatsFireBar.tint = 0xFF6961;
        towerStatsFireBar.update = function () {
            if (towerStatsFireBar.parent != towerMouseHighlight) {
                towerStatsFireBar.parent.removeChild(towerStatsFireBar);
                towerMouseHighlight.addChild(towerStatsFireBar);
            }
        };
        phaserGameWorld.addChild(towerStatsFireBar);
        var towerStatsAttackBar = new Phaser.Sprite(apg.g, -10, -43, 'assets/Rectangle.png');
        towerStatsAttackBar.scale = new Phaser.Point(0.6, 0.6);
        towerStatsAttackBar.tint = 0xE6C76A;
        towerStatsAttackBar.update = function () {
            if (towerStatsAttackBar.parent != towerMouseHighlight) {
                towerStatsAttackBar.parent.removeChild(towerStatsAttackBar);
                towerMouseHighlight.addChild(towerStatsAttackBar);
            }
        };
        phaserGameWorld.addChild(towerStatsAttackBar);
    }
}
//# sourceMappingURL=GameLogic.js.map