/*
 * Manage configurations
 * Save states with localStorage
 */
class Settings {
    Heading = 'ConfigHeading';
    Data = 'ConfigData';
    UIClass = 'ConfigUI';
    OptionItems = {
        'Language': {HTML: 'Language', Choices: true, IDs: ['en-US', 'zh-TW'], Prompts: ['改用中文','Switch to English']},
        'RKCBFlag': {HTML: 'RKCB',  Choices: true, IDs: ['0314', '1430']},
        };

    ConvCardBase = {
        'General': [`5-Card Major, Better Minor, Strong 2${Card.ltr2html('C')}, Strong NT`],
        'Major': [],
        'No Trump':	['2S Puppet to 3C', '2NT invitational'],
        'Minor':	['2NT Invitational'],
        'Strong 2♣':	['2♣-2♦ Waiting, 2♣-2♥ Double Negative'],
        'Preemptive':	['5-11 HCP', '6+ cards with honor(s) ',
            '7-cards at 3-level'],
        'Doubles':	[],
        'Competitive':	['8-16 HCP for Suit', '15~19 HCP for NT', 'Take-out up to 3♠'],
        'Others':	['High Reverse'],
        'Slam':	['5NT for King Count', 'Gerber for NT Contract']
            };

    ConvCategory = 
            {'Leaping Michaels': 'Competitive',
            'Lebensohl': 'Competitive',
            'Michaels': 'Competitive',
            'Sandwich 1NT': 'Competitive',
            'Unusual 2NT': 'Competitive',
            'Negative DBL': 'Doubles',
            'Responsive DBL': 'Doubles',
            'Support DBL': 'Doubles',
            'RKCB': 'General',
            'Bergen Raise': 'Major',
            'Jacoby 2NT': 'Major',
            'Limited Raise': 'Major',
            'Reverse Drury': 'Major',
            'Inverted Minor': 'Minor',
            'DONT': 'No Trump',
            'Gerber': 'No Trump',
            'Jacoby Transfer': 'No Trump',
            'Smolen': 'No Trump',
            'Stayman': 'No Trump',
            'Texas Transfer': 'No Trump',
            'Minor Transfer': 'No Trump',
            'Cappelletti': 'No Trump',
            'Ogust': 'Preemptive',
            'D0P1': 'Slam',
            'R0P1': 'Slam'};

    constructor(){
        this.Version = LatestGitTag;
        this.DisplayDate = DeployDate;
        globalThis.LatestGitTag = undefined;
        globalThis.DeployDate = undefined;
    }

    init(e) {
        this.disp = e;
        this.allConventions();
        var choiceSet = new Set();
        // Construct GUI options from data
        for (const bidComp of BidComponents) {
            if (bidComp.ChoiceOf != undefined) 
                    choiceSet.add(bidComp.ChoiceOf)
            if (!('BuiltIn' in bidComp) && bidComp.ChoiceOf == undefined) {
                this.OptionItems[bidComp.Name] = {'HTML': bidComp.Name};
                if (bidComp.DefaultOn != undefined && bidComp.DefaultOn)
                    this.OptionItems[bidComp.Name]['Value'] = 1;
            }
        }
        for (const choice of choiceSet) {
            let flagSet = new Set();
            BidComponents.forEach(comp => {
                if (comp.ChoiceOf && comp.ChoiceOf == choice)
                    flagSet.add(comp.Name);
            });
            this.OptionItems[choice] = {'HTML': choice, 'Choices': true, IDs: ['None']}
            let idx = 1;
            BidComponents.forEach(comp => {
                if (flagSet.has(comp.Name)) {
                    this.OptionItems[choice].IDs.push(comp.Name);
                    if (comp.DefaultOn != undefined && comp.DefaultOn)
                        this.OptionItems[choice]['Value'] = idx;
                    ++idx;
                }
            });
        }
    }

    // Go through each component and merge into base if so chosen
    makeBidRules() {
        // JS copying is shallow
        var working = {'Rules': {}}
        // base should be the first one
        for (let i = 0; i < BidComponents.length; i++) {
            let bidComp = BidComponents[i];
            if ('BuiltIn' in bidComp)
                working['Rules'] = this.mergeRules(working['Rules'], bidComp);
            else if (bidComp.ChoiceOf != undefined) {
                let idx = this.OptionItems[bidComp.ChoiceOf].Value;
                if (idx > 0 && bidComp.Name == this.OptionItems[bidComp.ChoiceOf].IDs[idx]) 
                    working['Rules'] = this.mergeRules(working['Rules'], bidComp);
            } else if (this.OptionItems[bidComp.Name].Value > 0)
                    working['Rules'] = this.mergeRules(working['Rules'], bidComp);
        }
        this.WorkingSet = working;
        this.setRKCB();
        this.rckbRules();
    }

    // Generate RKCB bidding rules based on the template set for 1S-4NT.
    rckbRules() {
        // First find all RKCB references
        var rkcbSeq = [];
        for (const c of BidComponents.filter(b => b.Name != 'RKCB')) {
            for (const r of c.Rules) {
                for (const b of r.Bids) {
                    for (const cr of b.Criteria) {
                        if (cr.Meta != undefined && cr.Meta.Convention != undefined && cr.Meta.Convention == 'RKCB') {
                            // Prepare to generate their follow-up bidding rules.
                            rkcbSeq.push([...r.Seq, b.Bid]);
                            rkcbSeq.push([...r.Seq, b.Bid, '-']);
                        }
                    }
                }
            }
        }
        
        /*
         * Search the template pattern.
         * Use a FIFO queue to find all the bidding sequences following up RKCB's first "4NT" bid.
         */
        var copyQueue = [['1S', '-', '4NT'], ['1S', '-', '4NT', '-']];
        var copyTemplates = {}; // use SeeKey as key
        var n = copyQueue.length;
        while (n > 0) {
            let qSet = copyQueue.shift();
            let k = seqKey(qSet);
            if (k in this.WorkingSet.Rules && !(k in copyTemplates)) {
                copyTemplates[k] = this.WorkingSet.Rules[k];
                copyQueue.push([...qSet, '-']);
                // Enter the interference and reply to seach queue
                for (const b of this.WorkingSet.Rules[k].Bids) {
                    copyQueue.push([...qSet, b.Bid]);   // oppoenent interfered
                    copyQueue.push([...qSet, b.Bid, '-']);  // no interference, straight reply
                }
            }
            n = copyQueue.length;   // force reevaluation
        }
        var newRules = this.WorkingSet.Rules;   // JS is shallow copy.  This is basically a pointer.
        for (const s of rkcbSeq) {
            let k = seqKey(s);
            if (k in this.WorkingSet.Rules)
                continue;   // already exists, no need to copy
            let lastIdx = s.indexOf('4NT');
            let lastS = s.at(lastIdx == s.length-1 ? lastIdx: -1);
            for (const v of Object.values(copyTemplates)) {
                if (lastS != '4NT' && v.Seq.at(v.Seq.indexOf('4NT')+1) != lastS)
                     continue;   // not the same template
                let newSeq = [...s, ...v.Seq.slice(v.Seq.indexOf('4NT')+(lastS != '4NT' ? 2 : 1))];
                newRules[seqKey(newSeq)] = {'Seq': newSeq, 'Bids': v.Bids};
            }
        }
    }

    // Flip 0314 and 1430
    setRKCB() {
        var rkcbIdx = []
        for (let [k, x] of Object.entries(this.WorkingSet.Rules)) {
            for (let r of x.Bids) {
                let isRKCB = false;
                r.Criteria.forEach((c)=>{isRKCB = isRKCB || (c.Meta && c.Meta.Convention && c.Meta.Convention == 'RKCB');})
                if (isRKCB && (r.Bid == '5C' || r.Bid == '5D') &&
                    x.Seq.length > 2 && x.Seq.at(-2) == '4NT' && !rkcbIdx.includes(k)) {
                        rkcbIdx.push(k);
                }
            }
        }

        for (const i of rkcbIdx) {
            let s = this.WorkingSet.Rules[i]
            for (const r of s.Bids) {
                if (r.Bid == '5C')
                    r.Criteria[0].KeyCard = (this.OptionItems.RKCBFlag.Value == 0) ? [0, 3] : [1, 4];
                else if (r.Bid == '5D')
                    r.Criteria[0].KeyCard = (this.OptionItems.RKCBFlag.Value == 0) ? [1, 4] : [0, 3];
            }
        }
    }

    // Deep copy source into the working set
    // Replace duplicates
    mergeRules(targetSet, newset) {
        function dupFlag(f, b) {
            if (f != undefined && f)
                b.Criteria.forEach(c => {
                    if (c.Meta == undefined)
                        c['Meta'] = {}
                    c.Meta['AllowDup'] = true;
                });
        }

        var keys = Object.keys(targetSet);  // cache
        for (const r of newset.Rules) {
            let k = seqKey(r.Seq);
            if (keys.includes(k)){
                // case of this rule has been in the existing set already
                for (const b of r.Bids) {
                    let idx = targetSet[k].Bids.findIndex((e)=> {return e.Bid == b.Bid;});
                    if (idx < 0) {
                        // The current ruleset does not have a same bid, we simply add to the end
                        targetSet[k].Bids.push(JSON.parse(JSON.stringify(b)));
                        let lastIdx = targetSet[k].Bids.length - 1;
                        dupFlag(newset.AllowDup, targetSet[k].Bids[lastIdx]);
                    } else {
                        let dupOK = false;
                        targetSet[k].Bids[idx].Criteria.forEach((c) => {
                            dupOK = dupOK || (c.Meta != undefined && c.Meta.AllowDup != undefined && c.Meta.AllowDup);
                        });
                        if (newset.AllowDup || dupOK) {
                            b.Criteria.forEach((c) => {
                                targetSet[k].Bids[idx].Criteria.push(JSON.parse(JSON.stringify(c)));
                                dupFlag(true, targetSet[k].Bids[idx]);
                            });
                        } else
                            for (const [x,v] of Object.entries(b))
                                targetSet[k].Bids[idx][x] = JSON.parse(JSON.stringify(v));
                    }
                }
            } else {
                // wholesale copy
                targetSet[k] = {'Seq': r.Seq};
                targetSet[k]['Bids'] = JSON.parse(JSON.stringify(r.Bids));
                targetSet[k].Bids.forEach((b)=> {dupFlag(newset.AllowDup, b); });
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
        row = this.BuiltInConventions(gridDiv, row);
        this.showOptions(gridDiv, row)
    }

    builtInObject() {
        var headings = {};
        for (const [k,v] of Object.entries(this.ConvCardBase)) {
            headings[k] = [];
            for (const x of v)
                headings[k].push(...x.split(',').map(x => x.trim()));
        }
        for (const c of this.convByCat.BuiltIn) {
            if (Object.hasOwn(this.ConvCategory, c)) {
                let cat = this.ConvCategory[c];
                if (Object.hasOwn(headings, cat))
                    headings[cat].push(c);
            } else
                headings['Others'].push(c);
        }
        headings['Slam'][headings['Slam'].indexOf('D0P1')] += '/R0P1';
        headings['Slam'].splice(headings['Slam'].indexOf('R0P1'), 1);
        return headings;
    }

    // Text are mostly hand-coded.
    BuiltInConventions(gridDiv, row) {
        var headings = this.builtInObject()
        const WRAP = this.ConvCardBase.General[0].length + 10
        var e = gridElement(gridDiv, trEnZh('Built-In Conventions'), 1, row++);
        e.style['grid-column'] = '1 / span 2'
        e.setAttribute('class', 'ConventionCard');
        // Translate words one by one
        for (const [k,v] of Object.entries(headings)) {
            e = gridElement(gridDiv, trEnZh(k), 1, row);
            e.setAttribute('class', this.Heading);
            let trStr = ''
            v.sort((a,b) => a.localeCompare(b)).forEach((x) => trStr += `${trEnZh(x)}, `);
            trStr = trStr.substring(0, trStr.length - 2)
            e = gridElement(gridDiv, trStr, 2, row++);
            e.setAttribute('class', this.Data);
        }
        return row;
    }

    // User clickables
    showOptions(gridDiv, row) {
        var e = gridElement(gridDiv, trEnZh('Options'), 1, row++);
        e.style['grid-column'] = '1 / span 2'
        e.setAttribute('class', 'ConventionCard');
        row = this.mkChoices(gridDiv, row);
        row = this.mkOnOffs(gridDiv, row);
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
            else if (k != 'Language' && this.OptionItems[k].Value == undefined) // Language is set above
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
        btn.setAttribute('value', trEnZh('Convention Card'));
        btn.addEventListener('click', () => this.convCard());
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

    // GUI for multiple choices
    mkChoices(gridDiv, row) {
        var allToggles = []
        Object.entries(this.OptionItems).forEach(([k, v]) => {
            if (k != 'Language' && 'Choices' in v)  {
                allToggles.push(k);
            }
        });
        var keys = allToggles.sort();
        for (const k of keys) {
            let v = this.OptionItems[k];
            let d = document.createElement('div')
            d.setAttribute('class', 'ConfigToggle');
            d.style['grid-row-start'] = row++;
            d.style['grid-column-start'] = 2;
            gridDiv.appendChild(d);
            let s = document.createElement('span')
            let l = document.createElement('label');
            l.setAttribute('class', this.UIClass);
            l.style['margin-left'] = '10px';
            l.innerHTML = `${trEnZh(v['HTML'])}:`;
            s.appendChild(l)
            d.appendChild(s)

            for (const tId of v['IDs']) {
                let ck = document.createElement('input');
                let tLabel = document.createElement('label');
                tLabel.setAttribute('for', tId);
                tLabel.innerHTML = trEnZh(tId);
                s.appendChild(tLabel);
                ck.setAttribute('name', k);
                ck.setAttribute('type', 'checkbox');
                ck.setAttribute('id', `${k}.${tId}`);
                ck.setAttribute('class', this.UIClass);
                ck.addEventListener('click', (e) => this.doOption(e));
                ck.checked  = v.IDs[v.Value] == tId;
                s.appendChild(ck);
            }
        }
        return row;
    }

    // Yes/No options
    mkOnOffs(gridDiv, row) {
        var flipItems = []
        Object.entries(this.OptionItems).forEach(([k, v]) => {
            if (v.Choices == undefined || !v.Choices) {
                flipItems.push(k)
            }
        });
        // Add a spacer
        var d = document.createElement('div')
        d.style['grid-row-start'] = row++;
        d.style['grid-column-start'] = 2
        d.innerHTML = '&nbsp;';
        gridDiv.appendChild(d);

        var flipKeys = flipItems.sort();
        for (const fkey of flipKeys) {
            let v = this.OptionItems[fkey];
            d = document.createElement('div')
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
            chk.setAttribute('id', fkey);
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
        btn.value = this.OptionItems.Language.Prompts[langIdx]
        this.OptionItems.Language['Value'] = 1-langIdx; // toggle

        localStorage.setItem('Language', this.OptionItems.Language['Value']);
        this.resetTopControls();
        this.showConfig();
        showFooter(Card.suitchars(), this.DisplayDate);
    }

    // When one of the options were clicked
    doOption(e) {
        // who was clicked?
        var chk = document.getElementById(e.target.id);
        var optFlag = chk.id;
        var optId = optFlag;
        var idx = optFlag.indexOf('.')
        if (idx > 0) {
            optId = optFlag.substring(idx+1)
            optFlag = optFlag.substring(0, idx);
        }
        let v = this.OptionItems[optFlag];
        // Was it one of the multiple choices?
        if ('IDs' in this.OptionItems[optFlag]) {
            // Which of the multiples was clicked?
            let thisIdx = v.IDs.indexOf(optId);
            if (v.IDs.length == 2) {    // one of the two.  It is a toggle.
                let otherIdx = 1 - thisIdx;
                let otherElem = document.getElementById(`${optFlag}.${v.IDs[otherIdx]}`)
                otherElem.checked = !chk.checked;
                v['Value'] = chk.checked ? thisIdx : otherIdx;
            } else {    
                // One of the multiple (more than 2).
                // If checked yes, then uncheck all others.
                if (chk.checked) {
                    for (let otherIdx = 0; otherIdx < v.IDs.length; otherIdx++) {
                        if (otherIdx != thisIdx) {
                            let otherElem = document.getElementById(`${optFlag}.${v.IDs[otherIdx]}`);
                            otherElem.checked = false;
                        }
                    }
                    v['Value'] = thisIdx;
                } else { 
                    // Otherwise, reset to the first item.
                    let thisItem = document.getElementById(`${optFlag}.${v.IDs[0]}`);
                    thisItem.checked = true; // reset to first item
                    v['Value'] = 0;
                }
            }
        } else 
            v.Value = chk.checked ? 1 : 0;    

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

    dumprules() {
        var rulestring = JSON.stringify(this.WorkingSet)
        clearContents(this.disp);
        var gridDiv = document.createElement('div');
        gridDiv.setAttribute('class', 'ConfigDisplay');
        this.disp.appendChild(gridDiv);
        var h;
        var e;
        var vIdx = 1;
        var bIdx = 1;
        var row = 1;
        for (const data of Object.values(this.WorkingSet.Rules)) {
            h = gridElement(gridDiv, '', 1, row);
            h.setAttribute('class', this.Heading);
            h.style['align-self'] = 'top';
            e = gridElement(gridDiv, '', 2, row);
            h.insertAdjacentHTML('beforeend',`${vIdx++}: ${JSON.stringify(data.Seq)}`)
            for (const b of data.Bids) {
                e.insertAdjacentHTML('beforeend',`${bIdx++}: <b>${b.Bid}</b><br>`)
                for (const c of b.Criteria)
                    e.insertAdjacentHTML('beforeend',`<span>&nbsp;&nbsp;</span>${JSON.stringify(c)}<br>`)
            }
            row++;
        }
    }

    /*
     * Convert the current configuration to a convention card that's good for printing.
     */
    convCard() {
        /* Collect the current active conventions */
        var conv = this.collectConventions();
        const SortOrder = ['Theme', 'General', 'Major',
        'No Trump', 'Minor', 'Strong 2♣', 'Preemptive',
        'Doubles', 'Competitive', 'Others', 'Slam'];

        /*
         * Add a new tab to the browser.
         * Add the necesssary header information.
         */
        var tab = window.open('about:blank', '_blank');
        tab.document.documentElement.lang = 'en';
        var e = document.createElement('meta');
        e.setAttribute('charset', 'UTF-8');
        tab.document.head.appendChild(e);

        [['author', 'Sin-Yaw Wang'], ['title', 'Convention Card'],
             ['description', 'Printable Convention Card']]
            .forEach(([name, content]) => {
            e = document.createElement('meta');
            e.setAttribute('name', name);
            e.setAttribute('content', content);
            tab.document.head.appendChild(e);
        });
        tab.document.title = 'Conventions Card';
        
        e = document.createElement('link');
        e.setAttribute('rel', 'stylesheet');
        e.setAttribute('href', 'styles.css');
        e.setAttribute('type', 'text/css');
        tab.document.head.appendChild(e); 

        /* Do it as HTML for now.  */
        const WRAP = this.ConvCardBase.General[0].length + 10
        var t = document.createElement('table');
        t.setAttribute('class', 'ConvCardTable');
        var tr = document.createElement('tr');
        tr.setAttribute('class', 'ConvCardRow');
        t.appendChild(tr);
        var td = document.createElement('th');
        td.setAttribute('colspan', '2');
        td.innerHTML = '&spades;<span style="color: red">&hearts;</span> '
            +tab.document.title + 
            ' <span style="color: red">&diams;</span>'+'&clubs;';
        td.setAttribute('class', 'ConvCardTblTitle');
        tr.appendChild(td);

        for (const k of SortOrder) {
            let v = conv[k];    
            let tr = document.createElement('tr');
            tr.setAttribute('class', 'ConvCardRow');
            t.appendChild(tr);
            let td = document.createElement('td');
            td.innerHTML = trEnZh(k);
            td.setAttribute('class', 'ConvCardTdHeading');
            tr.appendChild(td);
            
            // Simulate heading effect
            let tdFlag = false;
            let renderStr = '';
            for (const str of v.sort()) {
                if (renderStr.length + str.length <= WRAP) {
                    if (renderStr.length > 0) 
                        renderStr += ', ';
                    renderStr += trEnZh(str.trim());
                } else {
                    if (tdFlag) {
                        tr = document.createElement('tr');
                        tr.setAttribute('class', 'ConvCardRow');
                        t.appendChild(tr);
                        td = document.createElement('td');
                        td.innerHTML = '&nbsp;';
                        tr.appendChild(td);
                    }
                    td = document.createElement('td');
                    td.innerHTML = renderStr;
                    td.setAttribute('class', 'ConvCardTdData');
                    tr.appendChild(td);
                    renderStr = str;
                    tdFlag = true;
                }
            }
            if (renderStr.length > 0) {
                if (tdFlag) {
                    tr = document.createElement('tr');
                    tr.setAttribute('class', 'ConvCardRow');
                    t.appendChild(tr);
                    td = document.createElement('td');
                    td.innerHTML = '&nbsp;';
                    tr.appendChild(td);
                }
                td = document.createElement('td');
                td.innerHTML = renderStr;
                td.setAttribute('class', 'ConvCardTdData');
                tr.appendChild(td);
            }
        }

        // blank line
        tr = document.createElement('tr');
        t.appendChild(tr);
        td = document.createElement('td');
        td.innerHTML = '&nbsp;';
        tr.appendChild(td);
        td = document.createElement('td');
        td.innerHTML = '&nbsp;';
        tr.appendChild(td);

        tr = document.createElement('tr');
        tr.setAttribute('class', 'ConvCardRow');
        t.appendChild(tr);
        td = document.createElement('td');
        td.innerHTML = '&nbsp;';
        tr.appendChild(td);
        td = document.createElement('td');
        td.setAttribute('class', 'ConvCardTdData');
        td.innerHTML = trEnZh('Standard Carding');
        tr.appendChild(td);

        var convDate = new Date();
        var datestring = convDate.toLocaleDateString(Config.Language, {month: "short", year: "numeric", day: "numeric"});
        tr = document.createElement('tr');
        td = document.createElement('td');
        td.innerHTML = '&nbsp;';
        tr.appendChild(td);
        td = document.createElement('td');
        td.innerHTML = datestring;
        td.style['text-align'] = 'right';
        td.style['font-style'] = 'italic';
        td.style['font-size'] = '0.5em';
        tr.appendChild(td);
        t.appendChild(tr);
        tab.document.body.appendChild(t);
    }

    collectConventions() {
        var conv = this.builtInObject();

        conv.General[conv.General.indexOf('RKCB')] += ' ' + this.OptionItems['RKCBFlag'].IDs[this.OptionItems['RKCBFlag'].Value];

        conv['Theme'] = ['SAYC'];
        var twoOneFlag = this.OptionItems['2/1 Choice'].Value
        if (twoOneFlag > 0)
            conv.Theme = ['2/1 GF'];

        if (twoOneFlag == 1) {
            conv.Major.push('Bergen Raises')
            conv.Major.splice(conv.Major.indexOf('Limited Raise'), 1);
            if (this.OptionItems['Soloway Jump Shift'].Value <= 0)
                conv.Others.unshift('Weak Jump Shift');
        } else {
            if (this.OptionItems['Soloway Jump Shift'].Value > 0)
                conv.Others.unshift('Soloway Jump Shift');
            else
                conv.Others.splice(conv.Others.indexOf('Strong Jump Shift'), 1 );
        }

        for (const spllout of [['NMF', 'New Minor Forcing'],
            ['4SF', '4th Suit Forcing']]) {
                let idx = conv.Others.indexOf(spllout[0]);
                if (idx >= 0) {
                    conv.Others[idx] = spllout[1];
                }
            }

        for (const opt of this.convByCat.Adopted) {
            if (this.OptionItems[opt].Value > 0) {
                if (Object.hasOwn(this.ConvCategory, opt))
                    conv[this.ConvCategory[opt]].push(opt);
                else
                    conv['Others'].push(opt);
            }
        }
        if (!this.OptionItems['Ogust'].Value)
             conv['Preemptive'].push('2NT Ask Feature');

        return conv;
    }

    /*
     * Find all the conventions in the current set of rules and categorize
     * them into BuiltIn, ChoiceSet, and Adopted.
     */
    allConventions() {
        this.convByCat = {'BuiltIn': new Set(), 
            'ChoiceSet': {},
            'Adopted': new Set()};
        for (const bidComp of BidComponents) {
                bidComp.Rules.forEach((r) => {
                    r.Bids.forEach((b) => {
                        if ('Criteria' in b)
                            b.Criteria.forEach((c) => {
                                if ('Meta' in c && 'Convention' in c.Meta)
                                    if ('BuiltIn' in bidComp)
                                        this.convByCat.BuiltIn.add(c.Meta.Convention);
                                    else if (bidComp.ChoiceOf != undefined) {
                                        if (!Object.hasOwn(this.convByCat.ChoiceSet, bidComp.ChoiceOf)) 
                                            this.convByCat.ChoiceSet[bidComp.ChoiceOf] = {}
                                        if (!Object.hasOwn(this.convByCat.ChoiceSet[bidComp.ChoiceOf], bidComp.Name))
                                            this.convByCat.ChoiceSet[bidComp.ChoiceOf][bidComp.Name] = new Set();
                                        this.convByCat.ChoiceSet[bidComp.ChoiceOf][bidComp.Name].add(c.Meta.Convention);
                                    } else
                                        this.convByCat.Adopted.add(c.Meta.Convention);
                            });
                    });
                });
        }
        this.convByCat.BuiltIn.forEach((bIn) => {
            if (this.convByCat.Adopted.has(bIn))
                this.convByCat.Adopted.delete(bIn);
        });
    }
}

// OnClick handler for the config button
function Config3(divname) {
    Config.getDefaults();
    Config.showConfig();
}