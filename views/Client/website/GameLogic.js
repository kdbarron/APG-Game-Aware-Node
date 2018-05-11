var APGHelper = (function () {
    function APGHelper() {
    }
    APGHelper.ScreenX = function (val) { return val / 10000 * 1024; };
    APGHelper.ScreenY = function (val) { return (1 - val / 10000) * (768 - 96 - 96); };
    return APGHelper;
}());
function CacheGameAssets(c) {
    c.images('assets', ['blueorb.png', 'hudselect.png', 'TowerInformationPopup.png', 'background.png', 'HoverbuggyInformationPopup.png', 'HoverbossInformationPopup.png', 'HovercopterInformationPopup.png', 'HovertankInformationPopup.png', 'Rectangle.png']);
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
                        towerStatsAttackBar.scale = new Phaser.Point(metadataForFrame.items[towerID].attack * 0.75, 0.6);
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
    {
        var enemyID = 0;
        var waveNumber = -1;
        var waveImages = new Array();
        var waveText = new Array();
        var enemyHighlights = new Array();
        var enemyInformationArea = new Phaser.Sprite(apg.g, 800, 75, 'assets/background.png');
        enemyInformationArea.anchor = new Phaser.Point(0, 0);
        enemyInformationArea.scale = new Phaser.Point(0.35, 0.9);
        enemyInformationArea.update = function () {
            if (enemyMetadataForFrame != null) {
                if (enemyMetadataForFrame.waveNumber != waveNumber) {
                    for (var i = 0; i < waveImages.length; i++) {
                        phaserGameWorld.removeChild(waveImages[i]);
                    }
                    var overAenemy = false;
                    for (var i = 0; i < enemyMetadataForFrame.info.length; i++) {
                        var enemyInformationPopup = new Phaser.Sprite(apg.g, enemyInformationArea.x + 20, i * 100 + enemyInformationArea.y + 20, 'assets/' + enemyMetadataForFrame.info[i].enemyName + 'InformationPopup.png');
                        enemyInformationPopup.update = function () {
                            if (enemyMetadataForFrame != null) {
                                var x = enemyInformationPopup.x;
                                var y = enemyInformationPopup.y;
                                var scaleX = enemyInformationPopup.scale.x;
                                var scaleY = enemyInformationPopup.scale.y;
                                if (apg.g.input.activePointer.x >= x && apg.g.input.activePointer.x <= x + scaleX &&
                                    apg.g.input.activePointer.y >= y && apg.g.input.activePointer.y <= y + scaleY) {
                                    enemyID = i;
                                    overAenemy = true;
                                    console.log(overAenemy);
                                    for (var k = 0; k < enemyMetadataForFrame.enemies.length; k++) {
                                        var enemyHighlight = new Phaser.Sprite(apg.g, 0, 0, 'assets/blueorb.png');
                                        enemyHighlight.x = APGHelper.ScreenX(enemyMetadataForFrame.enemies[k].x);
                                        enemyHighlight.y = APGHelper.ScreenY(enemyMetadataForFrame.enemies[k].y);
                                        enemyHighlight.visible = true;
                                        phaserGameWorld.addChild(enemyHighlight);
                                        enemyHighlights.push(enemyHighlight);
                                    }
                                }
                            }
                        };
                        phaserGameWorld.addChild(enemyInformationPopup);
                        var enemyInformationText = new Phaser.Text(apg.g, 100, 10, "", { font: '12px Helvetica', fill: '#C0C0C0' });
                        enemyInformationText.anchor = new Phaser.Point(0, 0);
                        enemyInformationText.text = enemyMetadataForFrame.info[i].enemyName + "\nHealth: " + enemyMetadataForFrame.info[i].health + "\nSpeed: " + enemyMetadataForFrame.info[i].speed + "\nAttack:" + enemyMetadataForFrame.info[i].attack;
                        enemyInformationPopup.addChild(enemyInformationText);
                        var enemyStatsHealthBar = new Phaser.Sprite(apg.g, -10, -63, 'assets/Rectangle.png');
                        enemyStatsHealthBar.scale = new Phaser.Point(0.6, 0.6);
                        enemyStatsHealthBar.tint = 0xFF6961;
                        enemyStatsHealthBar.update = function () {
                            if (enemyStatsHealthBar.parent != enemyInformationPopup) {
                                enemyStatsHealthBar.parent.removeChild(enemyStatsHealthBar);
                                enemyInformationPopup.addChild(enemyStatsHealthBar);
                            }
                        };
                        phaserGameWorld.addChild(enemyStatsHealthBar);
                        var enemyStatsSpeedBar = new Phaser.Sprite(apg.g, -10, -43, 'assets/Rectangle.png');
                        towerStatsAttackBar.scale = new Phaser.Point(0.6, 0.6);
                        towerStatsAttackBar.tint = 0xE6C76A;
                        towerStatsAttackBar.update = function () {
                            if (towerStatsAttackBar.parent != towerMouseHighlight) {
                                towerStatsAttackBar.parent.removeChild(towerStatsAttackBar);
                                towerMouseHighlight.addChild(towerStatsAttackBar);
                            }
                        };
                        phaserGameWorld.addChild(towerStatsAttackBar);
                        waveImages.push(enemyInformationPopup);
                        waveText.push(enemyInformationText);
                    }
                    if (!overAenemy) {
                        enemyID = -1;
                        for (var i = 0; i < enemyHighlights.length; i++) {
                            phaserGameWorld.removeChild(enemyHighlights[i]);
                        }
                    }
                    waveNumber = enemyMetadataForFrame.waveNumber;
                }
            }
        };
        phaserGameWorld.addChild(enemyInformationArea);
    }
}
//# sourceMappingURL=GameLogic.js.map