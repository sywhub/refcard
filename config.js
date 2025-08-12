/*
 * Save states with localStorage
 */
class Settings {
    Heading = 'ConfigHeading';
    Data = 'ConfigData';
    langDict = {'zh-TW': 'Switch to English', 'en-US': '改用中文'};
    UIClass = 'ConfigUI';

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
        var configData ={
            // 'System': Biddings['System Name'],
            'Version': this.Version,
            'Language Using': this.Language,
        };
        
        var e;
        for (const [k,v] of Object.entries(configData)) {
            e = gridElement(gridDiv, trEnZh(k), 1, row);
            e.setAttribute('class', this.Heading);
            e = gridElement(gridDiv, trEnZh(v), 2, row++);
            e.setAttribute('class', this.Data);
        }
    }

    // Retrieve previously saved options from localStorage, if any.
    // Save back, immediately, the current values
    getDefaults() {
        var defaultSet = {
            'Language': 'en-US',
            'LastLaunch': undefined,
        };
        // get language from the browser
        if (navigator.languages.length > 0 && navigator.languages[0].length > 0)
            defaultSet.Language = navigator.languages[0];
        else if (navigator.language)
            defaultSet.Language = navigator.language;

        // replace everything with whatever saved before
        for (const k of Object.keys(defaultSet)) {
            if (k in localStorage)
                defaultSet[k] = localStorage.getItem(k);
        }
        // replace launch date
        let d = new Date(Date.now());
        defaultSet['LastLaunch'] = d;
        
        // save the fresh copy
        localStorage.clear();
        for (const [k,v] of Object.entries(defaultSet))
            localStorage.setItem(k, v)

        // now receive the settings
        this.Language = defaultSet.Language;
        this.LastLaunch = defaultSet.LastLaunch;
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
        btn.setAttribute('value', this.langDict[this.Language]);
        btn.addEventListener('click', (e) => this.switchLang(e));
        subd.appendChild(btn);
        subd.insertAdjacentHTML('beforeend', '<br>')
    }

    mkToggle(subd, twoofthem) {
        for (const toggle of twoofthem) {
            let sp = document.createElement('span')
            let l = document.createElement('label');
            l.setAttribute('for', toggle.Id)
            l.setAttribute('class', this.UIClass);
            l.style['margin-left'] = '10px';
            l.innerHTML = trEnZh(toggle.HTML)+': ';

            let ck = document.createElement('input');
            ck.setAttribute('type', 'checkbox');
            ck.setAttribute('id', toggle.Id);
            ck.setAttribute('class', this.UIClass);
            ck.addEventListener('click', (e) => this[toggle.FuncName](e));
            ck.checked = this[toggle.Flag];
            sp.appendChild(l);
            sp.appendChild(ck);
            subd.appendChild(sp)
        }
    }

    mkFlip(subd, flipItems) {
        for (const fItem of flipItems) {
            var sp = document.createElement('span')
            var l = document.createElement('label');
            l.setAttribute('class', this.UIClass);
            l.style['margin-left'] = '10px';
            l.innerHTML = trEnZh(fItem.HTML)+': ';
            var chk = document.createElement('input');
            chk.setAttribute('type', 'checkbox');
            chk.setAttribute('class', this.UIClass);
            chk.checked = this[fItem.Flag];
            chk.addEventListener('click', (e) => this.flipFlag(e, 'Adopt'+fItem.FuncName));
            sp.appendChild(l);
            sp.appendChild(chk);
            subd.appendChild(sp);
            subd.insertAdjacentHTML('beforeend', '<br>')
        }
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

        this.Language = lang;
        btn.value = this.langDict[lang];

        localStorage.setItem('Language', this.Language);
        this.resetTopControls();
        this.showConfig();
        showFooter(Card.suitchars(), this.DisplayDate);
    }


    flipFlag(e, flagName) {
        this[flagName] = e.target.checked;
        localStorage.setItem(flagName, this.YesNo(this[flagName]));
        this.makeBidRules();
        this.showConfig();
        this.getDefaults();
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

function dumpenzh(btn) {
    clearContents(Config.disp);
    var divElem = document.createElement('div');
    divElem.style['display'] = 'grid';
    divElem.style['grid-template-columns'] = '25em 25em';
    divElem.setAttribute('id', 'EnZh')
    Config.disp.appendChild(divElem);
    var btn = document.createElement('input');
    btn.setAttribute('type', 'button');
    btn.setAttribute('value', 'Save...');
    btn.setAttribute('onclick', 'DownLoadToFile("enzh.json","EnZh")');
    btn.style['grid-column-start'] = 2;
    btn.style['grid-row-start'] = 1;
    divElem.appendChild(btn);
    var e=gridElement(divElem, '<span class="Zero">English</span>:', 1, 2);
    e.style['justify-self'] = 'right';
    e.style['margin-right'] = '10px';
    gridElement(divElem, '中文', 2, 2);
    var r = 3;
    for (const [k,v] of Object.entries(enzh)) {
        var d = document.createElement('div');
        d.style['display'] = 'contents';
        divElem.appendChild(d);
        e = gridElement(d, "'"+k+"':", 1, r);
        e.setAttribute('class', 'Zero');
        e.style['justify-self'] = 'right';
        e.style['margin-right'] = '10px';
        gridElement(d, "'"+v+"',", 2, r);
        r++;
    }
}
