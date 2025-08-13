/*
 * Save states with localStorage
 */
class Settings {
    Heading = 'ConfigHeading';
    Data = 'ConfigData';
    langDict = {'zh-TW': 'Switch to English', 'en-US': '改用中文'};
    UIClass = 'ConfigUI';
    OptionItems = {
        'RKCBFlag': {HTML: 'RKCB',  IDs: ['0314', '1430']},
        'TwoOneChoice': {HTML: '2/1 Choice',  IDs: ['None', 'Thurston', 'GIB']},
        'Language': {HTML: 'Language', IDs: ['en-US', 'zh-TW']},
        'Ogust': {HTML: 'Ogust'}, // Ogust off by default
        'Sandwich1NT': {HTML: 'Sandwich 1NT'}, // Sandwich 1NT off by default
        'Lebensohl': {HTML: 'Lebensohl'}, // Lebensohl off by default
        'LeaningMichaels': {HTML: 'Leaping Michaels'}, // Leaping Michaels off by default
        'WeakJumpShift': {HTML: 'Weak Jump Shift'} // Weak Jump Shift off by default
        };

    constructor(){
        this.Version = LatestGitTag;
        this.DisplayDate = DeployDate;
        globalThis.LatestGitTag = undefined;
        globalThis.DeployDate = undefined;
    }

    init(e) {
        this.disp = e;
    }

    getConfig() {
        this.getDefaults();
        this.makeBidRules();
    }

    /* In sequence:
     * get Supplmental2 rules, with or without Leaping Michaels
     * Merge with BaseSAYC
     * As options: merge in either Thurston or GIB21
     * Then, also as option, merge in Lebensohl
     * 
     * Lastly, preload 3 conventions, then search for all the conventions in the system
     */
    makeBidRules() {
        // JS copying is shallow
        var working = {};
        working['BidRules'] = JSON.parse(JSON.stringify(BidComponents[0]))
        for (let i = 1; i < BidComponents.length; i++) {
            BidComponents[i][0].Name;
            working['BidRules'] = this.mergeRules(working['BidRules'], BidComponents[i]);
        }
    }

    // Flip 0314 and 1430
    changeRKCB() {
        var rkcbrules = this.WorkingSet.BidRules.filter(r=>
            r.Convention == 'RKCB' && (r.Bid == '5C' || r.Bid == '5D') &&
            r.BidSeq[r.BidSeq.length - 2] == '4NT');
        for (let r of rkcbrules) {
            if (r.Bid == '5C') {
                if (this.RKCBFlag)
                    r.Criteria.KeyCard = [0, 3];
                else
                    r.Criteria.KeyCard = [1, 4];
            }
            else if (r.Bid == '5D') {
                if (this.RKCBFlag)
                    r.Criteria.KeyCard = [1, 4];
                else
                    r.Criteria.KeyCard = [0, 3];
            }
        }
    }

    // remove from list one those with same bidseq and bid
    // then add 2nd list
    // this is not perfect as some conventions are not based on bidseq and bidding
    mergeRules(rules1, rules2, nomerge) {
        let duplist = rules1.filter(x => this.dedup(x, rules2, nomerge));
        rules2.forEach(x=>duplist.push(x));
        return duplist;
    }

    dedup(r, duplist, nomerge) {
        if (r.GIdx != undefined && Number(r.GIdx) == Number(nomerge))
            return true;

        for (const d of duplist) {
            if (compSequence(r.BidSeq, d.BidSeq) && r.Bid == d.Bid)
                return false;
        }
        return true;
    }

    YesNo(f) { return f ? 'Yes' : 'No';}
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
        var headings = {'General': '5-Card Major, Better Minor, Strong 2C, Strong NT, RKCB',
             'Major':
                '5+ cards, 12+ points. Reverse Drury, Jacoby 2NT, Limited Raise, Negative Double. Cue-bid 3-Card Support.',
             'No Trump':
                '1NT 15-17 HCP, 2NT 20~21 HCP. No voids, no singletons, at most one doubleton. Gerber, Stayman, Smolen, Jacoby Transfer. Texas Transfer, 2S Minor Transfer. 2NT invitational.',
             'Minor':
                '3+ cards, 12+ points. Inverted Minor',
             'Strong 2C': '22+HCP or 9+ tricks.  2D waiting, denies strong suit. 2H "Double Negative" 3-HCP.',
             'Preemptive': '6+ cards with honor(s), 8-11 points',
             'OverCall':
                "5+ cards, 8+ points. 1NT as open, with stopper in opponent's suit. Michaels/Unusual 2NT, DONT",
             'Double':
                'Take-out up to 3&spades;, Responsive Double, Support Double, Negative Double',
             'Others': 'Strong Jump Shift, Splinter, New Minor Forcing (NMF), 4th Suit Forcing (4SF), Doubl-0-pass-1 (D0P1), Redouble-0-pass-1 (R0P1)',
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
        subd.style['margin-top'] = '20px';
        subd.style['float'] = 'left';
        this.disp.appendChild(subd);

        var btn;
        btn = document.createElement('input');
        btn.setAttribute('type', 'button');
        btn.setAttribute('class', this.UIClass);
        btn.setAttribute('value', trEnZh('Reset'));
        btn.addEventListener('click', (e) => this.reset(e));
        subd.appendChild(btn);
        subd.insertAdjacentHTML('beforeend', '<br>')

        btn = document.createElement('input');
        btn.setAttribute('type', 'button');
        btn.setAttribute('class', this.UIClass);
        let langIdx = this.OptionItems.Language['Value'];
        let langValue = this.OptionItems.Language['IDs'][langIdx];
        btn.setAttribute('value', this.langDict[langValue]);
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

    switch21(chk) {
        var chkId = chk.target.id;
        var tbl = {'ConfigThurston': 'AdoptThurston',
            'ConfigGIB': 'AdoptGIB'}
        this[tbl[chkId]] = chk.target.checked;
        var other = [...Object.keys(tbl)].filter(k => k != chkId)[0];
        if (this[tbl[chkId]])
            this[tbl[other]] = !this[tbl[chkId]];
        localStorage.setItem(tbl[chkId], this.YesNo(this[tbl[chkId]]));
        localStorage.setItem(tbl[other], this.YesNo(this[tbl[other]]));
        var otherElem = document.getElementById(other);
        if (otherElem != null)
            otherElem.checked = this[tbl[other]];
        this.makeBidRules();
        this.showConfig();
        this.getDefaults();
    }

    // One of them is always checked
    switchRKCB(chk) {
        const tbl = ['RKCB0314', 'RKCB1430'];
        var chkIdx = tbl.indexOf(chk.target.id);
        document.getElementById(tbl[1-chkIdx]).checked = !chk.target.checked;
        this.RKCBFlag = (chk.target.checked && chkIdx == 0) || (chkIdx == 1 && !chk.target.checked);
        localStorage.setItem('RKCBFlag', this.YesNo(this.RKCBFlag));
        this.changeRKCB();
        this.showConfig();
        this.getDefaults();
    }

    switchLang(btn) {
        var btnString = btn.target.value;
        var lang = Object.keys(this.langDict).find(k=>this.langDict[k] == btnString);
        lang = Object.keys(this.langDict).find(k=> k != lang);

        var langIdx = this.OptionItems.Language.IDs.indexOf(lang);
        this.OptionItems.Language['Value'] = langIdx
        btn.value = this.langDict[lang];

        localStorage.setItem('Language', langIdx);
        this.resetTopControls();
        this.showConfig();
        showFooter(Card.suitchars(), this.DisplayDate);
    }


    doOption(e) {
        var chk = document.getElementById(e.target.id);
        for (const [k, v] of Object.entries(this.OptionItems)) {
            if ('IDs' in v && v.IDs.includes(chk.id)) { 
                let thisIdx = v.IDs.indexOf(chk.id);
                if (v.IDs.length == 2) {
                    let otherIdx = 1 - thisIdx;
                    let otherElem = document.getElementById(v.IDs[otherIdx]);
                    otherElem.checked = !chk.checked;
                    v['Value'] = chk.checked ? thisIdx : otherIdx;
                } else {    
                    if (chk.checked) {
                        for (let otherIdx = 0; otherIdx < v.IDs.length; otherIdx++) {
                            if (otherIdx != thisIdx) {
                                let otherElem = document.getElementById(v.IDs[otherIdx]);
                                otherElem.checked = false;
                            }
                        }
                        v['Value'] = thisIdx;
                    } else { 
                        let thisItem = document.getElementById(v.IDs[0]);
                        thisItem.checked = true; // reset to first item
                        v['Value'] = 0;
                    }
                }
                break;
            } else if (k == chk.id) {
                v['Value'] = chk.checked ? 1 : 0;
                break;
            }
        }
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

    ConventionURL(c) {
        const ConvURL = {
            '2/1 GF': '',
            '2C-2D Waiting': '',
            '2C-2H Double Negative': '',
            '2S Minor Transfer': '', 
            '5-Card Major': '',
            'Bergen Raise': 'https://www.bridgebum.com/bergen_raises.php',
            'Better Minor': '',
            'D0P1': 'https://www.bridgebum.com/double_0_pass_1.php',
            'DONT': '',
            'Gerber': '',
            'HSGT': 'https://www.bridgebum.com/help_suit_game_try.php',
            'High Reverse': 'https://www.bridgehands.com/H/High_Reverse.htm',
            'Inverted Minor': '',
            'Jacoby 2NT': '',
            'Jacoby Transfer': '',
            'Leaping Michaels': 'https://www.bridgebum.com/leaping_michaels.php',
            'Lebensohl': '',
            'Michaels': '',
            'Negative DBL': '',
            'Ogust': 'https://www.bridgebum.com/ogust.php',
            'Opener Reverse': 'https://www.bridgehands.com/R/Reverse.htm',
            'R0P1': 'https://www.bridgebum.com/ropi.php',
            'RKCB': 'https://www.bridgebum.com/roman_key_card_blackwood.php',
            'Responsive DBL': 'https://www.bridgebum.com/responsive_double.php',
            'Reverse Drury': 'https://www.bridgebum.com/reverse_drury.php',
            'Smolen': 'https://web2.acbl.org/documentLibrary/play/Commonly_Used_Conventions/smolen.pdf',
            'Splinter': '',
            'Sandwich 1NT': 'https://www.bridgebum.com/sandwich_1nt.php',
            'Stayman': '',
            'Strong 2C': '',
            'Strong Jump Shift': '',
            'Strong NT': '',
            'Support DBL': '',
            'Take-Out DBL': '',
            'Texas Transfer': '',
            'Unusual 2NT': ''};
        if (c in ConvURL && ConvURL[c] != '')
            return ConvURL[c];
        return null;
    }
}

// OnClick handler for the config button
function Config3(divname) {
    Config.init(document.getElementById(divname));
    Config.showConfig();
}