let sAPIKey;
let oData;
let oClipboard;
const aSlots = [
    'Helm',
    'Shoulders',
    'Coat',
    'Gloves',
    'Leggings',
    'Boots',
    'Backpack',
    'WeaponA1',
    'WeaponA2',
    'WeaponB1',
    'WeaponB2'
]

$(document).ready(function () {
    loadAPIKey();
    setAPIKey();
    if (sAPIKey) {
        main();
    }
})

function main() {
    getData().done(function (characterData) {
        characterData.forEach(character => {
            getEquipmentByCharacter(character.name, character.equipment);
        });
        writeDOM();
    }).catch(function (oResponse) { debugger; alert(oResponse.responseJSON.text) })
}

function onClickRefresh(oBtn) {
    $(oBtn).prop("disabled", true);
    setTimeout(function () { $(oBtn).prop("disabled", false) }, 1000);

    main();
}

function onClickCopy(sChar) {
    alert('Copied to Clipboard');
    navigator.clipboard.writeText(oClipboard[sChar].sort(sortClipboard).map(e => e[Object.keys(e)]).join("\n"));
}

function onChangeAPIKey() {
    setAPIKey();
    main();
}

function getData() {
    oData = {}
    return $.ajax({ url: 'https://api.guildwars2.com/v2/characters?ids=all&access_token=' + sAPIKey });
}

function loadAPIKey() {
    if (localStorage.APIKey) {
        $(document.getElementById("inputAPIKey")).val(localStorage.APIKey);
    }
}

function setAPIKey() {
    localStorage.APIKey = $(document.getElementById("inputAPIKey")).val();
    sAPIKey = localStorage.APIKey;
}

function getEquipmentByCharacter(sCharacter, aEquipment) {
    oData[sCharacter] = {};
    for (let i = 0; i < aEquipment.length; i++) {
        const e = aEquipment[i];
        if (aSlots.indexOf(e.slot) !== -1) {
            if (e.skin) { //skin if the item was transmutated
                oData[sCharacter][e.slot] = { skinID: e.skin }
            } else { //id if the item wasn't transmutated,
                oData[sCharacter][e.slot] = { itemID: e.id }
            }

            if (e.dyes) {
                oData[sCharacter][e.slot].dyes = e.dyes;
            }

            if (e.infusions) {
                oData[sCharacter][e.slot].infusions = e.infusions;
            }
        }
    }

    getSkinsAndDyes(sCharacter);
}

function getSkinsAndDyes(sCharacter) {
    let aAPIRequestsItems = [],
        aAPIRequestsSkins = [],
        aAPIRequestsColors = [],
        aAPIRequestsInfusions = [];

    for (const iterator in oData[sCharacter]) {
        let iSkinID = oData[sCharacter][iterator].skinID;
        let iItemID = oData[sCharacter][iterator].itemID;
        let aDyes = oData[sCharacter][iterator].dyes;
        let aInfusions = oData[sCharacter][iterator].infusions;

        if (iSkinID) {
            aAPIRequestsSkins.push(iSkinID);
        } else if (iItemID) {
            aAPIRequestsItems.push(iItemID);
        }

        if (aDyes) {
            for (let i = 0; i < aDyes.length; i++) {
                const dye = aDyes[i];
                if (dye) {
                    aAPIRequestsColors.push(dye);
                }
            }
        }

        if (aInfusions) {
            for (let i = 0; i < aInfusions.length; i++) {
                const infusion = aInfusions[i];
                if (infusion) {
                    aAPIRequestsInfusions.push(infusion);
                }
            }
        }
    }

    aAPIRequestsSkins = Array.from(new Set(aAPIRequestsSkins));
    if (aAPIRequestsSkins.length) {
        $.ajax({ url: 'https://api.guildwars2.com/v2/skins?ids=' + aAPIRequestsSkins.join(), character: sCharacter }).done(function (data) {
            mapData(sCharacter, 'skins', data);
        })
    }
    aAPIRequestsItems = Array.from(new Set(aAPIRequestsItems));
    if (aAPIRequestsItems.length) {
        $.ajax({ url: 'https://api.guildwars2.com/v2/items?ids=' + aAPIRequestsItems.join(), character: sCharacter }).done(function (data) {
            mapData(sCharacter, 'items', data);
        })
    }

    aAPIRequestsColors = Array.from(new Set(aAPIRequestsColors));
    if (aAPIRequestsColors.length) {
        $.ajax({ url: 'https://api.guildwars2.com/v2/colors?ids=' + aAPIRequestsColors.join(), character: sCharacter }).done(function (data) {
            mapData(sCharacter, 'colors', data);
        })
    }

    aAPIRequestsInfusions = Array.from(new Set(aAPIRequestsInfusions));
    if (aAPIRequestsInfusions.length) {
        $.ajax({ url: 'https://api.guildwars2.com/v2/items?ids=' + aAPIRequestsInfusions.join(), character: sCharacter }).done(function (data) {
            mapData(sCharacter, 'infusions', data);
        })
    }
}

function mapData(sCharacter, sType, aData) {
    for (const iterator in oData[sCharacter]) {
        if (sType === "skins") {

            if (oData[sCharacter][iterator].skinID) {
                for (let i = 0; i < aData.length; i++) {
                    const e = aData[i];
                    if (e.id === oData[sCharacter][iterator].skinID) {
                        oData[sCharacter][iterator].name = e.name;
                        oData[sCharacter][iterator].icon = e.icon;
                    }
                }
            }
        } else if (sType === "items") {
            if (oData[sCharacter][iterator].itemID) {
                for (let i = 0; i < aData.length; i++) {
                    const e = aData[i];
                    if (e.id === oData[sCharacter][iterator].itemID) {
                        oData[sCharacter][iterator].name = e.name;
                        oData[sCharacter][iterator].icon = e.icon;
                    }
                }
            }
        } else if (sType === "infusions") {
            if (oData[sCharacter][iterator].infusions) {
                for (let k = 0; k < oData[sCharacter][iterator].infusions.length; k++) {
                    const infusion = oData[sCharacter][iterator].infusions[k];
                    for (let i = 0; i < aData.length; i++) {
                        const e = aData[i];
                        if (e.id === infusion) {
                            oData[sCharacter][iterator].infusions[k] = { name: e.name, icon: e.icon };
                        }
                    }
                }
            }
        } else if (sType === "colors") {
            if (oData[sCharacter][iterator].dyes) {
                for (let k = 0; k < oData[sCharacter][iterator].dyes.length; k++) {
                    const dye = oData[sCharacter][iterator].dyes[k];
                    if (dye) {
                        for (let i = 0; i < aData.length; i++) {
                            const e = aData[i];
                            if (e.id === dye) {
                                oData[sCharacter][iterator].dyes[k] = { name: e.name, rgb: e.cloth.rgb };
                            }
                        }
                    }
                }
            }
        }
    }
    storeData();
}

function storeData() {
    localStorage.oData = JSON.stringify(oData);
}

function writeDOM() {
    const oDataStored = JSON.parse(localStorage.oData);
    oClipboard = {};

    $("#tabs").html('<ul id="charList"></ul>');

    let i = 0;
    for (const char in oDataStored) {
        const sChar = char.replace(/[^\w\d]/gi, "") + i;
        oClipboard[sChar] = [{ Header: 'Slot\tName\tDyes\tInfusions' }];

        $("#charList").append(`<li><a href="#char-${sChar}">${char}</li>`);

        let aItems = [];
        for (const item in oDataStored[char]) {
            const oItem = oDataStored[char][item];
            aItems.push(`
            <div data-slot="${item}" class="row">
            <div class="col-1"> <img src="${oItem.icon}"></div>
                <div class="col-1">${item}</div>
                <div class="col-3">${oItem.name}</div>
                <div class="col"> ${getDyes(oItem.dyes) || ""}</div>
                <div class="col-3"> ${getInfusions(oItem.infusions) || ""}</div>
            </div>`);

            let oTemp = {};
            oTemp[item] = item + '\t' + oItem.name + '\t' + formatDyes(oItem.dyes) + '\t' + formatInfusions(oItem.infusions);
            oClipboard[sChar].push(oTemp);
        }

        $("#tabs").append(`
        <div id="char-${sChar}">${aItems.sort(sortItems).join("")}
            <button onclick="onClickCopy('${sChar}')" class="btn btn-secondary position-absolute bottom-0 end-0"><i class="bi bi-clipboard-check"></i> Copy to Clipboard</button>
        </div>`);

        i++;
    }

    try {
        $('#tabs').tabs("destroy");
    } catch (error) {
    }
    $('#tabs').tabs();
}

function formatDyes(aDyes) {
    if (aDyes) {
        return aDyes.map(function (d) { if (d) { return d.name } else { return "-" } });
    }
    return "";
}
function formatInfusions(aInfusions) {
    if (aInfusions) {
        return aInfusions.map(i => i.name);
    }
    return "";
}

function sortClipboard(a,b){
    let mSlotValues = getSlotValues();
    let valueSlotA = mSlotValues[Object.keys(a)[0]];
    let valueSlotB = mSlotValues[Object.keys(b)[0]];
    return valueSlotA - valueSlotB;
}

function sortItems(a, b) {
    let mSlotValues = getSlotValues();
    let valueSlotA = mSlotValues[$(a).data('slot')];
    let valueSlotB = mSlotValues[$(b).data('slot')];
    return valueSlotA - valueSlotB;
}

function getSlotValues() {
    return {
        'Header': -1,
        'Helm': 0,
        'Shoulders': 1,
        'Coat': 2,
        'Gloves': 3,
        'Leggings': 4,
        'Boots': 5,
        'Backpack': 6,
        'WeaponA1': 7,
        'WeaponA2': 8,
        'WeaponB1': 9,
        'WeaponB2': 10
    }
}

function getDyes(aDyes) {
    if (aDyes) {
        let aDyeNames = [];
        for (let i = 0; i < aDyes.length; i++) {
            const dye = aDyes[i];
            if (dye && dye.rgb) {
                aDyeNames.push(`
                    <span style="color: ${getBestColor(dye.rgb)}; background-color: rgb(${dye.rgb.join()})">${dye.name}</span>
                `);
            } else {
                aDyeNames.push(" - ")
            }
        }
        return aDyeNames.join("|");
    }
}

function getInfusions(aInfusions) {
    if (aInfusions) {
        let aInfusionsNames = [];
        for (let i = 0; i < aInfusions.length; i++) {
            const infusion = aInfusions[i];
            if (infusion) {
                aInfusionsNames.push(`
                    <span><img src="${infusion.icon}" style="height: 24px"> ${infusion.name}</span>
                `);
            }
        }
        return aInfusionsNames.join("|");
    }
}

function getBestColor(aRGB = [0, 0, 0]) {
    const contrast = ((aRGB[0] * 0.299) + (aRGB[1] * 0.587) + (aRGB[2] * 0.114))
    return contrast > 180 ? 'black' : 'white';
}