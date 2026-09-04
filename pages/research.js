const fs = require('fs');
const jsd = require('jsdom');
const { JSDOM } = jsd;
const https = require('https');

// CP cells render as "<div>Max CP</div> 117", so pull the trailing number out of the text.
function parseCombatPower(element)
{
    var match = (element?.textContent || "").match(/(\d+)\s*$/);
    return match ? parseInt(match[1]) : -1;
}

function get()
{
    return new Promise(resolve => {
        JSDOM.fromURL("https://leekduck.com/research/", {
        })
        .then((dom) => {

            var taskNameToID = [];
            taskNameToID["Event Tasks"] = "event";
            taskNameToID["Catching Tasks"] = "catch";
            taskNameToID["Throwing Tasks"] = "throw";
            taskNameToID["Battling Tasks"] = "battle";
            taskNameToID["Exploring Tasks"] = "explore";
            taskNameToID["Training Tasks"] = "training";
            taskNameToID["Team GO Rocket Tasks"] = "rocket";
            taskNameToID["Buddy & Friendship Tasks"] = "buddy";
            taskNameToID["AR Scanning Tasks"] = "ar";
            taskNameToID["Sponsored Tasks"] = "sponsored";


            var types = dom.window.document.querySelectorAll('.task-category');

            var research = [] 
            
            types.forEach (_e =>
            {
                _e.querySelectorAll(":scope > .task-list > .task-item").forEach(task => {
                    var text = task.querySelector(":scope > .task-text").textContent.trim();
                    var type = taskNameToID[_e.querySelector(":scope > h2").textContent.trim()];

                    var rewards = [];
                    
                    task.querySelectorAll(":scope > .reward-list > .reward").forEach(r => {
                        if (r.dataset.rewardType == "encounter")
                        {
                            var reward = { 
                                name: "",
                                image: "",
                                canBeShiny: false,
                                combatPower: {
                                    min: -1,
                                    max: -1
                                }
                            };

                            reward.name = r.querySelector(":scope > .reward-label").textContent.trim();
                            reward.image = r.querySelector(":scope > .reward-bubble > .reward-image").src;

                            reward.combatPower.min = parseCombatPower(r.querySelector(":scope > .cp-values > .min-cp"));
                            reward.combatPower.max = parseCombatPower(r.querySelector(":scope > .cp-values > .max-cp"));
                            reward.canBeShiny = r.querySelector(":scope > .reward-bubble > .shiny-icon") != null;

                            rewards.push(reward);
                        }
                    });

                    if (rewards.length > 0)
                    {
                        if (research.filter(r => r.text == text && r.type == type).length > 0)
                        {
                            var foundResearch = research.findIndex(fr => { return fr.text == text });
                            rewards.forEach(rw => {
                                research[foundResearch].rewards.push(rw);
                            });
                        }
                        else
                        {
                            research.push({ "text": text, "type": type, "rewards": rewards});
                        }
                    }
                });
            });

            fs.writeFile('files/research.json', JSON.stringify(research, null, 4), err => {
                if (err) {
                    console.error(err);
                    return;
                }
            });
            fs.writeFile('files/research.min.json', JSON.stringify(research), err => {
                if (err) {
                    console.error(err);
                    return;
                }
            });
        }).catch(_err =>
            {
                console.log(_err);
                https.get("https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/research.min.json", (res) =>
                {
                    let body = "";
                    res.on("data", (chunk) => { body += chunk; });
                
                    res.on("end", () => {
                        try
                        {
                            let json = JSON.parse(body);
    
                            fs.writeFile('files/research.json', JSON.stringify(json, null, 4), err => {
                                if (err) {
                                    console.error(err);
                                    return;
                                }
                            });
                            fs.writeFile('files/research.min.json', JSON.stringify(json), err => {
                                if (err) {
                                    console.error(err);
                                    return;
                                }
                            });
                        }
                        catch (error)
                        {
                            console.error(error.message);
                        };
                    });
                
                }).on("error", (error) => {
                    console.error(error.message);
                });
            });
    })
}

module.exports = { get }