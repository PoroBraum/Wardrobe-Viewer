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
    navigator.clipboard.writeText(oClipboard[sChar]);
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
    for (const iterator in oData[sCharacter]) {
        let iSkinID = oData[sCharacter][iterator].skinID;
        let iItemID = oData[sCharacter][iterator].itemID;
        let aDyes = oData[sCharacter][iterator].dyes;
        let aInfusions = oData[sCharacter][iterator].infusions;

        let iRequestID;
        let sRequestEndpoint;

        if (iSkinID) {
            iRequestID = iSkinID;
            sRequestEndpoint = 'skins';
        } else if (iItemID) {
            iRequestID = iItemID;
            sRequestEndpoint = 'items';
        }

        $.ajax({ url: 'https://api.guildwars2.com/v2/' + sRequestEndpoint + '/' + iRequestID, iterator: iterator, character: sCharacter, dyes: aDyes, infusions: aInfusions }).done(function (data) {
            oData[this.character][this.iterator].name = data.name;
            oData[this.character][this.iterator].icon = data.icon;

            if (this.dyes) {
                for (let i = 0; i < this.dyes.length; i++) {
                    const dye = this.dyes[i];
                    if (dye) {
                        $.ajax({ url: 'https://api.guildwars2.com/v2/colors/' + dye, iterator: iterator, character: sCharacter, i: i }).done(function (data) {
                            oData[this.character][this.iterator].dyes[i] = { name: data.name, rgb: data.cloth.rgb };
                            storeData();
                        })
                    }
                }
            }

            if (this.infusions) {
                for (let i = 0; i < this.infusions.length; i++) {
                    const infusion = this.infusions[i];
                    if (infusion) {
                        $.ajax({ url: 'https://api.guildwars2.com/v2/items/' + infusion, iterator: iterator, character: sCharacter, i: i }).done(function (data) {
                            oData[this.character][this.iterator].infusions[i] = { name: data.name, icon: data.icon };
                            storeData();
                        })
                    }
                }
            } else {
                storeData();
            }
        })
    }
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
        oClipboard[sChar] = 'Slot\tName\tDyes\tInfusions\n';

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

            oClipboard[sChar] += item + '\t' + oItem.name + '\t' + formatDyes(oItem.dyes) + '\t' + formatInfusions(oItem.infusions) + '\n';
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

function sortItems(a, b) {
    mSlotValues = {
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

    let valueSlotA = mSlotValues[$(a).data('slot')];
    let valueSlotB = mSlotValues[$(b).data('slot')];
    return valueSlotA - valueSlotB;
}

function getDyes(aDyes) {
    if (aDyes) {
        let aDyeNames = [];
        for (let i = 0; i < aDyes.length; i++) {
            const dye = aDyes[i];
            if (dye) {
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