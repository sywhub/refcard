/*
 * Manage configurations
 * Save states with localStorage
 */
class Settings {
    Heading = 'ConfigHeading';
    Data = 'ConfigData';
    UIClass = 'ConfigUI';
    OptionItems = {
        'Language': {HTML: 'Language', IDs: ['en-US', 'zh-TW'], Prompts: ['改用中文','Switch to English']},
        'RKCBFlag': {HTML: 'RKCB',  IDs: ['0314', '1430']},
        'TwoOneChoice': {HTML: '2/1 GF Choice',  IDs: ['None', 'P. Thurston 2/1', 'GIB 2/1']},
        };

    constructor(){
        this.Version = LatestGitTag;
        this.DisplayDate = DeployDate;
        globalThis.LatestGitTag = undefined;
        globalThis.DeployDate = undefined;
    }

    init(e) {
        this.disp = e;
        for (const bidComp of BidComponents) {
            if (!('BuildIn' in bidComp) && !this.OptionItems['TwoOneChoice'].IDs.includes(bidComp.Name) &&
                this.OptionItems[bidComp.Flag] == undefined) 
                this.OptionItems[bidComp.Flag] = {'HTML': bidComp.Name};
        }
    }

    // Go through each component and merge into base if so chosen
    makeBidRules() {
        // JS copying is shallow
        var working = {};
        working['BidRules'] = this.mergeRules({}, BidComponents[0].BidRules);
        for (let i = 1; i < BidComponents.length; i++) {
            let bidComp = BidComponents[i];
            if ('BuildIn' in bidComp)
                working['BidRules'] = this.mergeRules(working['BidRules'], bidComp.BidRules);
            else if (this.OptionItems.TwoOneChoice.IDs.includes(bidComp.Name)) {
                let idx = this.OptionItems.TwoOneChoice.Value;
                if (idx > 0 && bidComp.Name == this.OptionItems.TwoOneChoice.IDs[idx]) 
                    working['BidRules'] = this.mergeRules(working['BidRules'], bidComp.BidRules);
            } else if (bidComp.Flag in this.OptionItems && this.OptionItems[bidComp.Flag].Value > 0)
                    working['BidRules'] = this.mergeRules(working['BidRules'], bidComp.BidRules);
        }
        this.WorkingSet = working;
        this.changeRKCB();
    }

    // Flip 0314 and 1430
    changeRKCB() {
        var rkcbIdx = []
        for (let [k, x] of Object.entries(this.WorkingSet.BidRules)) {
            for (let r of x.Bids) {
                if (r.Convention == 'RKCB' && (r.Bid == '5C' || r.Bid == '5D') &&
                    x.Seq.length > 2 && x.Seq.at(-2) == '4NT' && !rkcbIdx.includes(k)) {
                        rkcbIdx.push(k);
                }
            }
        }
        for (const i of rkcbIdx) {
            let r = this.WorkingSet.BidRules[i]
            for (let j = 0; j < r.Bids.length; j++) {
                if (r.Bids[j].Bid == '5C') {
                    if (this.OptionItems.RKCBFlag.Value == 0)
                        r.Bids[j].Criteria[0].KeyCard = [0, 3];
                    else
                        r.Bids[j].Criteria[0].KeyCard = [1, 4];
                } else if (r.Bids[j].Bid == '5D') {
                    if (this.OptionItems.RKCBFlag.Value == 0)
                        r.Bids[j].Criteria[0].KeyCard = [1, 4];
                    else
                        r.Bids[j].Criteria[0].KeyCard = [0, 3];
                }
            }
        }
    }

    // Deep copy source into the working set
    // Replace duplicates
    mergeRules(targetSet, newset) {
        var keys = Object.keys(targetSet);  // cache
        for (const r of newset) {
            let k = seqKey(r.Seq);
            if (keys.includes(k)){
                // case of this rule has been in the existing set already
                for (const b of r.Bids) {
                    let idx = targetSet[k].Bids.findIndex((e)=> {return e.Bid == b.Bid;});
                    if (idx < 0)
                        // The current ruleset does not have a same bid, we simply add to the end
                        targetSet[k].Bids.push(JSON.parse(JSON.stringify(b)));
                    else {
                        // found a bid that's the same.
                        // decide to replace the current criteria or append
                        // the only decision factor is whether it was Drury or not
                        let findDrury = (e) => {return e.Meta && e.Meta.Convention == 'Reverse Drury';};
                        let druryIdx = targetSet[k].Bids[idx].Criteria.findIndex(findDrury);
                        if (druryIdx < 0)
                            druryIdx = b.Criteria.findIndex(findDrury);
                        if (druryIdx >= 0) 
                            b.Criteria.forEach((c) => {targetSet[k].Bids[idx].Criteria.push(JSON.parse(JSON.stringify(c)));});
                        else
                            for (const [x,v] of Object.entries(b))
                                targetSet[k].Bids[idx][x] = JSON.parse(JSON.stringify(v));
                    }
                }
            } else {
                // wholesale copy
                targetSet[k] = {'Seq': r.Seq};
                targetSet[k]['Bids'] = JSON.parse(JSON.stringify(r.Bids));
                keys.push(k);   // don't make a dup next time
            }
        }
        return targetSet;
    }

    showConfig() {
        clearContents(this.disp);
        this.makeControl();
        var gridDiv = document.createElement('div');
        gridDiv.setAttribute('class', 'ConfigDisplay');
        this.disp.appendChild(gridDiv);

        var row = 1;
        var e = gridElement(gridDiv, trEnZh('Version'), 1, row);
        e.setAttribute('class', this.Heading);
        e = gridElement(gridDiv, trEnZh(this.Version), 2, row++);
        e.setAttribute('class', this.Data);
        row = this.showBaseCard(gridDiv, row)
        this.showOptions(gridDiv, row);
    }

    showBaseCard(gridDiv, row) {
        var headings = {'General': `5-Card Major, Better Minor, Strong 2${Card.ltr2html('C')}, Strong NT, RKCB`,
             'Major':
                '5+ cards, 12+ points. Reverse Drury, Jacoby 2NT, Limited Raise, Negative Double. Cue-bid 3-Card Support.',
             'No Trump':
                `1NT 15-17 HCP, 2NT 20~21 HCP. Gerber, Stayman, Smolen, Jacoby Transfer. Texas Transfer, 2${Card.ltr2html('S')} Minor Transfer. 2NT invitational.`,
             'Minor':
                '3+ cards, 12+ points. Inverted Minor',
             'Strong 2C': `22+HCP or 9+ tricks.  2${Card.ltr2html('D')} waiting, denies strong suit. 2${Card.ltr2html('H')} "Double Negative" 3-HCP.`,
             'Preemptive': '6+ cards with honor(s), 8-11 points',
             'OverCall':
                "5+ cards, 8+ points. 1NT as open, with stopper in opponent's suit. Michaels/Unusual 2NT, DONT",
             'Double':
                `Take-out up to 3${Card.ltr2html('S')}, Responsive Double, Support Double, Negative Double`,
             'Others': 'Strong Jump Shift, Splinter, New Minor Forcing (NMF), 4th Suit Forcing (4SF), Doubl-0-pass-1 (D0P1), Redouble-0-pass-1 (R0P1), Sandwich 1NT, High Reverse',
            };
        for (const [k,v] of Object.entries(headings)) {
            var e = gridElement(gridDiv, trEnZh(k), 1, row);
            e.setAttribute('class', this.Heading);
            e = gridElement(gridDiv, trEnZh(v), 2, row++);
            e.setAttribute('class', this.Data);
        }    
        return row;
    }

    showOptions(gridDiv, row) {
        var e = gridElement(gridDiv, trEnZh('Options'), 1, row);
        e.setAttribute('class', this.Heading);
        row = this.mkToggles(gridDiv, row);
        row = this.mkFlips(gridDiv, row);
    }

    // Retrieve previously saved options from localStorage, if any.
    // Save back, immediately, the current values
    getDefaults() {
        // get language from the browser
        var lang;
        if (navigator.languages.length > 0 && navigator.languages[0].length > 0)
            lang = navigator.languages[0];
        else if (navigator.language)
            lang = navigator.language;
        var langIdx = this.OptionItems.Language.IDs.indexOf(lang);
        this.OptionItems.Language['Value'] = langIdx;


        // replace everything with whatever saved before
        for (const k of Object.keys(this.OptionItems)) {
            if (k in localStorage)
                this.OptionItems[k]['Value'] = localStorage.getItem(k);
            else if (k != 'Language') // Language is set above
                this.OptionItems[k]['Value'] = 0;
        }
        
        // save the fresh copy
        localStorage.clear();
        for (const [k,v] of Object.entries(this.OptionItems)) {
            localStorage.setItem(k, v['Value']);
        }
    }

    makeControl() {
        var subd = document.createElement('div');
        subd.setAttribute('class', 'ConfigLeft')
        this.disp.appendChild(subd);

        var btn;
        btn = document.createElement('input');
        btn.setAttribute('type', 'button');
        btn.setAttribute('class', this.UIClass);
        btn.setAttribute('value', trEnZh('Reset'));
        btn.addEventListener('click', () => this.reset());
        subd.appendChild(btn);
        subd.insertAdjacentHTML('beforeend', '<br>')

        btn = document.createElement('input');
        btn.setAttribute('type', 'button');
        btn.setAttribute('class', this.UIClass);
        let langIdx = this.OptionItems.Language['Value'];
        btn.setAttribute('value', this.OptionItems.Language.Prompts[langIdx]);
        btn.addEventListener('click', (e) => this.switchLang(e));
        subd.appendChild(btn);
        subd.insertAdjacentHTML('beforeend', '<br>')
    }

    mkToggles(gridDiv, row) {
        var allToggles = [];
        Object.entries(this.OptionItems).forEach(([k, v]) => {
            if (k != 'Language' && 'IDs' in v)  {
                let o = {};
                o[k] = v;
                allToggles.push(o)
            }
        });
        for (const toggle of allToggles) {
            let v = Object.values(toggle)[0];
            let d = document.createElement('div')
            d.setAttribute('class', 'ConfigToggle');
            d.style['grid-row-start'] = row++;
            d.style['grid-column-start'] = 2;
            gridDiv.appendChild(d);
            let s = document.createElement('span')
            let l = document.createElement('label');
            l.setAttribute('class', this.UIClass);
            l.style['margin-left'] = '10px';
            l.innerHTML = trEnZh(v['HTML']+': ');
            s.appendChild(l)
            d.appendChild(s)

            for (const tId of v['IDs']) {
                let ck = document.createElement('input');
                let tLabel = document.createElement('label');
                tLabel.setAttribute('for', tId);
                tLabel.innerHTML = trEnZh(tId);
                s.appendChild(tLabel);
                ck.setAttribute('name', toggle.Flag);
                ck.setAttribute('type', 'checkbox');
                ck.setAttribute('id', tId);
                ck.setAttribute('class', this.UIClass);
                ck.addEventListener('click', (e) => this.doOption(e));
                ck.checked  = v.IDs[v.Value] == tId;
                s.appendChild(ck);
            }
        }
        return row;
    }

    mkFlips(gridDiv, row) {
        var flipItems = [];
        Object.entries(this.OptionItems).forEach(([k, v]) => {
            if (!('IDs' in v && v.IDs.length > 0)) {
                let o = {};
                o[k] = v;
                flipItems.push(o);
            }
        });
        for (const fItem of flipItems) {
            let v = Object.values(fItem)[0];
            let d = document.createElement('div')
            d.setAttribute('class', 'ConfigToggle');
            d.style['grid-row-start'] = row++;
            d.style['grid-column-start'] = 2;
            gridDiv.appendChild(d);
            let sp = document.createElement('span')
            let l = document.createElement('label');
            l.setAttribute('class', this.UIClass);
            l.style['margin-left'] = '10px';
            l.innerHTML = trEnZh(v.HTML)+': ';
            var chk = document.createElement('input');
            chk.setAttribute('type', 'checkbox');
            chk.setAttribute('class', this.UIClass);
            chk.setAttribute('id', Object.keys(fItem)[0]);
            chk.checked = v['Value'] > 0;
            chk.addEventListener('click', (e) => this.doOption(e));
            sp.appendChild(l);
            sp.appendChild(chk);
            d.appendChild(sp);
        }
        return row;
    }

    switchLang(btn) {
        var btnString = btn.target.value;
        var langIdx = this.OptionItems.Language.Prompts.indexOf(btnString);
        this.OptionItems.Language['Value'] = 1-langIdx; // toggle
        btn.value = this.OptionItems.Language.Prompts[langIdx]

        localStorage.setItem('Language', langIdx);
        this.resetTopControls();
        this.showConfig();
        showFooter(Card.suitchars(), this.DisplayDate);
    }

    // When one of the options were clicked
    doOption(e) {
        // who was clicked?
        var chk = document.getElementById(e.target.id);
        var changed = []
        for (const [k, v] of Object.entries(this.OptionItems)) {
            // Was it one of the multiple choices?
            if ('IDs' in v && v.IDs.includes(chk.id)) { 
                // Which of the multiples was clicked?
                let thisIdx = v.IDs.indexOf(chk.id);
                if (v.IDs.length == 2) {    // one of the two.  It is a toggle.
                    let otherIdx = 1 - thisIdx;
                    let otherElem = document.getElementById(v.IDs[otherIdx]);
                    otherElem.checked = !chk.checked;
                    v['Value'] = chk.checked ? thisIdx : otherIdx;
                } else {    
                    // One of the multiple (more than 2).
                    // If checked yes, then uncheck all others.
                    if (chk.checked) {
                        for (let otherIdx = 0; otherIdx < v.IDs.length; otherIdx++) {
                            if (otherIdx != thisIdx) {
                                let otherElem = document.getElementById(v.IDs[otherIdx]);
                                otherElem.checked = false;
                            }
                        }
                        v['Value'] = thisIdx;
                    } else { 
                        // Otherwise, reset to the first item.
                        let thisItem = document.getElementById(v.IDs[0]);
                        thisItem.checked = true; // reset to first item
                        v['Value'] = 0;
                    }
                }
                changed.push(k);
                break;
            } else if (k == chk.id) {
                // The "yes/no" option
                v['Value'] = chk.checked ? 1 : 0;
                changed.push(k);
                break;

            }
        }
        // Persist
        for (const [k, v] of Object.entries(this.OptionItems))
            localStorage.setItem(k, v['Value']);
        this.makeBidRules();
    }

    resetTopControls() {
        ['About', 'Settings', 'Statistics', 'Quick Reference', 'Bid Practice']
            .forEach(x => {
                let e = document.getElementById('Bid'+x.replace(' ', ''));
                if (e != null)
                    e.value = trEnZh(x);
            });
    }

    reset() {
        localStorage.clear();
        this.getDefaults();
        this.showConfig();
        this.resetTopControls();
    }


}

// OnClick handler for the config button
function Config3(divname) {
    Config.getDefaults();
    Config.showConfig();
}