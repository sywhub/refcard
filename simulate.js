class SimStat extends BidSystem {
    constructor(menuId) {
        super()
        this.SenarioMenu = ['1M', '1m','1NT', '2C', 'Preempt'];
        this.SimulateMap = {'Name': 'Simulate',
            '1M': [['1S', '-'],['1H', '-']],
            '1m': [['1D', '-'],['1C', '-']],
            '1NT': [['1NT', '-']], '2C': [['2C', '-']],
            'Preempt':[['2S', '-'],['2H', '-'],['2D', '-']]};
        this.StatsMap = {'Name': 'Statistics',
            '1x': [['1S', '-'],['1H', '-'],['1D', '-'],['1C', '-']],
            '1NT': [['1NT', '-']],
            'Preempt':[['2S', '-'],['2H', '-'],['2D', '-']]};

        this.initDisplay()
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
        e.insertAdjacentHTML('beforeend', `Statistics: ${s}<br>`);
        var criteriaKeys = [];
        for (let r of Object.keys(Config.WorkingSet.Rules))
            for (let b of Config.WorkingSet.Rules[r].Bids)
                for (let c of b.Criteria)
                    for (let k of Object.keys(c))
                        if (!criteriaKeys.includes(k))
                            criteriaKeys.push(k);
        criteriaKeys.sort();
        e.insertAdjacentHTML('beforeend', `Criteria: ${criteriaKeys.join(', ')}<br>`);
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
        e.insertAdjacentHTML('beforeend', `Seq: ${seqString} [`);
        for (const o of options)
            e.insertAdjacentHTML('beforeend', `${o}, `);
        e.insertAdjacentHTML('beforeend', ']<br>');
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