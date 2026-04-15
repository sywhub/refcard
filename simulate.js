class SimStat extends BidSystem {
    constructor(menuId) {
        super()
        this.SenarioMenu = [];
        this.SimulateMap = {'Name': 'Simulate',
            '1M': [['1S', '-'],['1H', '-']],
            '1m': [['1D', '-'],['1C', '-']],
            '1NT': [['1NT', '-']], '2C': [['2C', '-']],
            'Preempt':[['2S', '-'],['2H', '-'],['2D', '-']]};
        this.StatsMap = {'Name': 'Statistics',
            '5M-6m': ['5M-6m'],
            '1NT': [['1NT', '-']],
            'Preempt':[['2S', '-'],['2H', '-'],['2D', '-']]};

        this.initDisplay()
        let menuSet = new Set();
        for (const s of Object.keys(this.SimulateMap)) {
            if (s != 'Name')
                menuSet.add(s);
        }
        for (const s of Object.keys(this.StatsMap)) {
            if (s != 'Name')
                menuSet.add(s);
        }
        this.SenarioMenu = Array.from(menuSet).sort();
        const e = document.getElementById(menuId);
        this.makeSelect(e, 'Scenario: ', 'Scenario', this.SenarioMenu);
        this.board = new Board(new Deck());
    }

    initDisplay() {
        var e = document.getElementById('ListDisplay');
        this.disp = document.createElement('div');
        this.disp.setAttribute('id', 'SimStat');
        this.disp.setAttribute('class', 'SimStat');
        e.appendChild(this.disp);
    }

    makeSelect(parentDiv, lTxt, selId, optitems) {
        this.scenario = document.getElementById(selId);
        if (this.scenario == null) {
            var l = document.createElement('label');
            l.setAttribute('class', 'SelectLable');
            l.innerHTML = lTxt;
            l.setAttribute('for', selId)
            parentDiv.appendChild(l)
            this.scenario = document.createElement('select');
            this.scenario.setAttribute('id', selId);
            parentDiv.appendChild(this.scenario);
            optitems.forEach(s => {
                let opt = document.createElement('option');
                if (s == '-') {
                    opt.setAttribute('disabled', '');
                    opt.setAttribute('value', '');
                    opt.innerHTML = '&#x2500;'.repeat(4);
                } else {
                    opt.setAttribute('value', s);
                    opt.innerHTML = s;
                }
                this.scenario.appendChild(opt);
            });
        }
    }

    work(map) {
        if (Config.WorkingSet == undefined || Config.WorkingSet == null) {
            Config.getDefaults();
            Config.makeBidRules();
        }
        var e = document.getElementById('ListDisplay');
        clearContents(e)
        this.initDisplay()
        e = document.getElementById('SimStat');
        var scenario = simModule.scenario.value;
        if (scenario in map) {
            let cases = map[scenario];
            for (const s of cases) {
                switch (map.Name) {
                    case 'Simulate':
                        this.doSimulate(e, s);
                        break;
                    case 'Statistics':
                        this.doStats(e, s);
                        break;
                }
            }
        } else 
            e.insertAdjacentHTML('beforeend', `${map.Name} does not handle ${scenario}<br>`);
    }

    matchCriteria(hand, bid, c) {
        var met = true;
        var metCount = 0;
        for (let [k,v] of Object.entries(c)) {
            switch (k) {
                case 'LTC':
                case 'TP':
                case 'HCP':
                    if (Array.isArray(v)) {
                        if (v[0] == 0)
                            met = hand[k] <= v[1];
                        else if (v[0] == v[1])
                            met = hand[k] == v[1];
                        else
                            met = hand[k] >= v[0] && hand[k] <= v[1];
                    } else
                        met = hand[k] >= v;
                    ++metCount;
                    break;
                case 'AnySuit':
                case 'Control':
                case 'Honors':
                case 'Shape':
                case 'Stopper':
                    met = true;
                    break;
                case 'SuitLen':
                    let suitCode = Card.ltr2code(bid) - Card.Club();
                    if (Array.isArray(v)) {
                        if (v[0] == 0)
                            met = hand.Suits[suitCode] <= v[1];
                        else if (v[0] == v[1])
                            met = hand.Suits[suitCode] == v[1];
                        else
                            met = hand.Suits[suitCode] >= v[0] && hand.Suits[k] <= v[1];
                    } else if (typeof(v) == 'object') {
                        for (const [sKey, sVal] of Object.entries(v)) {
                            let whichSuit = Card.ltr2code(sKey) - Card.Club();
                            if (Array.isArray(sVal)) {
                                if (sVal[0] == 0)
                                    met = hand.Suits[whichSuit] <= sVal[1];
                                else if (Number(sVal[0]) == Number(sVal[1]))
                                    met = hand.Suits[whichSuit] == sVal[1];
                                else
                                    met = hand.Suits[whichSuit] >= sVal[0] && hand.Suits[whichSuit] <= sVal[1];
                            } else
                                met = hand.Suits[whichSuit] >= sVal;
                            if (!met)
                                break
                        }
                    } else
                        met = hand.Suits[suitCode] >= v;
                    ++metCount;
                    break;
                case 'Seat':
                    met = false;
                    ++metCount;
                    break;
                case 'Meta':
                case 'KeyCard':
                case 'KingCount':
                case 'SideKing':
                case 'SingleVoid':
                case 'AceCount':
                case 'TrumpQ':
                    // ignore
                    met = true;
                    break;
                default:
                    console.log(`Unknown criteria ${k} in ${JSON.stringify(c)}`);
                    met = false;
                    break;
            }
            if (!met)
                break;
        }
        return metCount > 0 && met;
    }

    doStats(e, s) {
        switch (s) {
            case '5M-6m':
                this.doStats5M6m(e, s);
                break;
            default:
                e.insertAdjacentHTML('beforeend', `${s} Not implemented yet<br>`);
                return;
        }
    }

    // Statis for 6-card minor and 5-card major hands with 12+ HCP. For each hand, check if game or slam is achievable.
    doStats5M6m(e, s) {
        const statCriteria = [
            {HCP: 11, SuitLen: {'S': 5, 'D': 6}},
            {HCP: 11, SuitLen: {'S': 5, 'C': 6}},
            {HCP: 11, SuitLen: {'H': 5, 'D': 6}},
            {HCP: 11, SuitLen: {'H': 5, 'C': 6}}];
        let c = null;
        let dealCount = 0;
        let boardValues = {};
        let stats = {'Maj Game': 0, 'Min Game': 0, 'Maj TP Slam': 0, 'Open': 0,  'Maj LTC 12': 0, 'Min LTC 12': 0, 'Min TP Slam': 0};
        while (dealCount < 1000000) {
            let found = false
            let seat = 0;
            while (!found) {
                ++dealCount;
                this.board.deal();
                for (c of statCriteria) {
                    for (seat = 0; seat < 4 && !found; seat++)
                        found = this.matchCriteria(this.board.seats[seat], null, c);
                    if (found)
                        break;
                }
            }
            stats['Open']++;
            --seat;
            boardValues['HCP'] = this.board.seats[seat].HCP + this.board.seats[this.roundSeat(seat+2)].HCP;
            boardValues['TP'] = this.board.seats[seat].TP + this.board.seats[this.roundSeat(seat+2)].TP;
            boardValues['LTC'] = this.board.seats[seat].LTC + this.board.seats[this.roundSeat(seat+2)].LTC;
            for (const k of Object.keys(c.SuitLen)) {
                let key = ['S', 'H'].includes(k) ? 'Major' : 'Minor';
                let suitCode = Card.ltr2code(k) - Card.Club();
                boardValues[key] = 
                    this.board.seats[seat].Suits[suitCode] + this.board.seats[this.roundSeat(seat+2)].Suits[suitCode];
            }
            if (boardValues.Major > 8) {
                if (boardValues.TP > 26)
                    ++stats['Maj Game'];
                if (boardValues.TP > 30)
                    ++stats['Maj TP Slam'];
                if (boardValues.LTC < 13)
                    ++stats['Maj LTC 12'];
            } else if (boardValues.Minor > 8) {
                if (boardValues.TP > 28)
                    ++stats['Min Game'];
                if (boardValues.TP > 30)
                    ++stats['Min TP Slam'];
                if (boardValues.LTC < 13)
                    ++stats['Min LTC 12'];
            }
        }
        e.insertAdjacentHTML('beforeend', `${dealCount} dealt<br>`);
        e.insertAdjacentHTML('beforeend', `${stats["Open"]} were 6m-5M ${(stats["Open"]/dealCount*100).toFixed(2)}%<br>`);
        e.insertAdjacentHTML('beforeend', `${stats["Maj Game"]} Major game achievable ${(stats["Maj Game"]/stats["Open"]*100).toFixed(2)}%<br>`);
        e.insertAdjacentHTML('beforeend', `&nbsp;&nbsp;${stats["Maj TP Slam"]} Major Slam Achievable via TP ${(stats["Maj TP Slam"]/stats["Maj Game"]*100).toFixed(2)}%<br>`);
        e.insertAdjacentHTML('beforeend', `&nbsp;&nbsp;${stats["Maj LTC 12"]} Major Slam Achievable via LTC ${(stats["Maj LTC 12"]/stats["Maj Game"]*100).toFixed(2)}%<br>`);
        e.insertAdjacentHTML('beforeend', `${stats["Min Game"]} Minor Achievable ${(stats["Min Game"]/stats["Open"]*100).toFixed(2)}%<br>`);
        e.insertAdjacentHTML('beforeend', `&nbsp;&nbsp;${stats["Min TP Slam"]} Minor Slam Achievable via TP ${(stats["Min TP Slam"]/stats["Min Game"]*100).toFixed(2)}%<br>`);
        e.insertAdjacentHTML('beforeend', `&nbsp;&nbsp;${stats["Min LTC 12"]} Minor Slam Achievable via LTC ${(stats["Min LTC 12"]/stats["Min Game"]*100).toFixed(2)}%<br>`);
    }

    doSimulate(e, s) {
        let sKey = seqKey(s);
        if (!(sKey in Config.WorkingSet.Rules))
            return;

        let bids = Config.WorkingSet.Rules[sKey];
        let seqString = this.seqString(bids.Seq);
        let spread = new Array(bids.Bids.length);
        for (let i = 0; i < spread.length; i++)
            spread[i] = {Count: 0, CriterCount: new Array(bids.Bids[i].Criteria.length).fill(0)};
        var bIdx = Math.floor(Math.random() * spread.length);
        var b = bids.Bids[bIdx];
        var [seat, options] = this.findSeqMatch(bids.Seq, b.Bid);
        if (options.length > 0) {
            e.insertAdjacentHTML('beforeend', `Seq: ${seqString} [`);
            for (const o of options)
                e.insertAdjacentHTML('beforeend', `${o}, `);
            e.insertAdjacentHTML('beforeend', ']<br>');
        }
        if (seat != null) {
            e.insertAdjacentHTML('beforeend', `&nbsp;&nbsp;North: ${this.board.seats[seat]}<br>`);
            e.insertAdjacentHTML('beforeend', `&nbsp;&nbsp;South: ${this.board.seats[this.roundSeat(seat+2)]}<br>`);
        }
    }

    findSeqMatch(seq, bid) {
        var NSHUFFULS = 500;
        var found = null
        var options = null;
        do
            [found, options] = this.seqMatchOnce(seq, bid);
        while (found == null && --NSHUFFULS > 0);
        return [found, options];
    }


    seqMatchOnce(seq, bid) {
        const NSHUFFULS = 100;
        var open = null, matches;
        const notFound = [null, null];
        // First try NSHUFFLES times to find a match for the opening bid,
        // then if found try to find matches for the subsequent bids without shuffling
        // Last see if the next seat meet the final criteria.
        for (let i = 0; i < NSHUFFULS && open == null; i++)  {
            this.board.deal();
            let j = 0;
            while (open == null && j < 4) 
                [open, matches] = this.matchSeat(seq[0], Config.WorkingSet.Rules[seqKey('Open')], j++);
        }
        if (open == null)
            return notFound;
        var subseqBid = null
        for (let k = 0; k < seq.length-1; k++) {
            let nextSeat = this.roundSeat(open+k+1);
            [subseqBid, matches] = this.matchSeat(seq[k+1], Config.WorkingSet.Rules[seqKey(seq.slice(0,k+1))], nextSeat);
            if (subseqBid == null)
                return notFound;
        }
        let finalSeat = this.roundSeat(open+seq.length);
        matches = null;
        [subseqBid, matches] = this.matchSeat(bid, Config.WorkingSet.Rules[seqKey(seq)], finalSeat);
        if (subseqBid == null)
            return notFound;
        return [open, matches];
    }

    matchSeat(expect, rules, seat) {
        let matches = [];
        for (const b of rules.Bids) 
            for (const c of b.Criteria) 
                if (!matches.includes(b.Bid) && this.matchCriteria(this.board.seats[seat], b.Bid, c))
                    matches.push(b.Bid)
        if ((expect == '-' && matches.length == 0) || matches.includes(expect))
            return [seat, matches];
        return [null, null];   
    }


}

// Click handlers
function Simulate(e) { simModule.work(simModule.SimulateMap); }
function RunStat(e) { simModule.work(simModule.StatsMap); }