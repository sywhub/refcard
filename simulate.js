/*
 * Sin-Yaw Wang, 2026
 * This module is for simulating and collecting stats on hands that meet certain
 * criteria.  It is designed to be flexible and extensible, allowing for different
 * scenarios and statistics to be defined and collected.
 */
class SimStat extends BidSystem {
    constructor(menuId) {
        super()
        this.epsilon = 0.0005;  // stabilization threshold for stats.  If the percentage change is less than this, we consider it stabilized.
        // Things we handle.
        // What we will generate simulated hands that meet the criteria for the bidding sequences.
        this.SimulateMap = {'Name': 'Simulate',
            '1M': [['1S', '-'],['1H', '-']],
            '1NT Interfere': [['1NT']],
            '1m': [['1D', '-'],['1C', '-']],
            '1NT': [['1NT', '-']], '2C': [['2C', '-']],
            'Preempt':[['2S', '-'],['2H', '-'],['2D', '-']]};
        // Things we will calculate states.
        this.StatsMap = {'Name': 'Statistics',
            '5-5': ['5-5'],
            '5M-6m': ['5M-6m']};

        this.initDisplay()
        let menuSet = [...Object.keys(this.SimulateMap), '-', ...Object.keys(this.StatsMap)].filter(v => v != 'Name');
        const e = document.getElementById(menuId);
        this.makeSelect(e, 'Scenario: ', 'Scenario', menuSet);
        this.board = new Board(new Deck());
    }

    // Make a sub div element for displaying the results.  This is to allow us to clear the results without affecting the menu.
    initDisplay() {
        var e = document.getElementById('ListDisplay');
        this.disp = document.createElement('div');
        this.disp.setAttribute('id', 'SimStat');
        this.disp.setAttribute('class', 'SimStat');
        e.appendChild(this.disp);
    }

    // Make a select element for the menu.  If it already exists, just return it.
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

    /* Trasition from click handler to class method.
     * Caller decided which map, we use the selected value to dispatch the work.
     */
    action(map) {
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

    // Check if the hand meets the criteria.
    // Bid is used only when SuitLen did not spcifiy the suit.
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
                case 'Stopper':
                    // XX: to be implemented.
                    met = true;
                    break;
                case 'Shape':
                    if (v == '5-5')
                        met = hand.Suits.filter(s => s >= 5).length >= 2;
                    else if (v == '5-4') {
                        met = hand.Suits.filter(s => s >= 5).length >= 2;
                        if (!met)
                            met = (hand.Suits.filter(s => s >= 5).length == 1 && hand.Suits.filter(s => s == 4).length >= 1)
                    } else if (v == 'Balanced')
                        met = hand.Suits.filter(s => s < 2).length == 0 && hand.Suits.filter(s => s == 2).length <= 2;
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

    // Dispatcher for statistics calculations.
    // Construct the data structure and pass it to the workhorse function.
    doStats(e, s) {
        /*
         * state object:
         * toMeet: list of criteria to meet.
         * "msg": message to display before the stats table.
         * round: (optional) number of rounds for each iteration.
         * colHdrs: column headers for the stats table.  The first column is for the number of shuffles.
         * evalFunc: function to evaluate the hand and return an object with the values needed for counting.
         * countFunc: function to update the raw counts based on the evaluated hand.
         * calcDblBuf: function to calculate the double buffer and check for stabilization.
         * displayFunc: (optional) function to display the results.
         */
        var statObj = {}
        switch (s) {
            case '5-5':
                statObj.toMeet = [
                    {HCP: 16, Shape: '5-5'},
                    {HCP: 11, Shape: '5-5'}
                ];
                statObj.colHdrs = ['Dealt', 'Open', 'Normal', 'Strong'];
                statObj.msg = 'Stats for 5-5 hands with 11+ HCP. For each hand, check if it is openable and if so whether it is normal or strong.';
                statObj.evalFunc = (seat, cIdx, board) => {
                    let e = {'HCP': board.seats[seat].HCP};
                    return e;
                }
                statObj.countFunc = (boardEval, rawCount, samples, sampleSize, seat) => { 
                    if (boardEval.HCP < 16) {
                        rawCount['Normal']++;
                        if (Math.random() < 0.2 && samples.length < sampleSize)
                            samples.push([JSON.parse(JSON.stringify(this.board.seats[seat].hand))]);
                    } else {
                        rawCount['Strong']++;
                        if (Math.random() < 0.5 && samples.length < sampleSize)
                            samples.push([JSON.parse(JSON.stringify(this.board.seats[seat].hand))]);
                    }
                };
                statObj.calcDblBuf = (dblBuf, dblIdx, rawCount) => {
                    dblBuf[dblIdx]['Open'] = rawCount['Open']/rawCount['Dealt'];
                    dblBuf[dblIdx]['Normal'] = rawCount['Normal']/rawCount['Open'];
                    dblBuf[dblIdx]['Strong'] = rawCount['Strong']/rawCount['Open'];
                    // Are we stablized?
                    return Math.abs(dblBuf[dblIdx]['Normal'] - dblBuf[1-dblIdx]['Normal']) < this.epsilon;
                }
                this.workStats(e, s, statObj);
                break;
            case '5M-6m':
                statObj.toMeet = [
                    {HCP: 11, SuitLen: {'S': 5, 'D': 6}},
                    {HCP: 11, SuitLen: {'S': 5, 'C': 6}},
                    {HCP: 11, SuitLen: {'H': 5, 'D': 6}},
                    {HCP: 11, SuitLen: {'H': 5, 'C': 6}}];
                statObj.colHdrs = ['Dealt', 'Open', 'Major Game', 'Major TP Slam', 'Major LTC 12', 'Minor Game', 'Minor TP Slam', 'Minor LTC 12'];
                statObj.msg = 'Stats for 6-card minor and 5-card major hands with 12+ HCP. For each hand, check if game or slam is achievable.';
                statObj.evalFunc = (seat, cIdx, board) => {
                    var boardEval = {};
                    let pSeat = this.roundSeat(seat+2); // partner
                    boardEval['HCP'] = board.seats[seat].HCP + board.seats[pSeat].HCP;
                    boardEval['TP'] = board.seats[seat].TP + board.seats[pSeat].TP;
                    boardEval['LTC'] = board.seats[seat].LTC + board.seats[pSeat].LTC;
                    for (const k of Object.keys(statObj.toMeet[cIdx].SuitLen)) {
                        let key = ['S', 'H'].includes(k) ? 'Major' : 'Minor';
                        let suitCode = Card.ltr2code(k) - Card.Club();
                        boardEval[key] = 
                            board.seats[seat].Suits[suitCode] + board.seats[pSeat].Suits[suitCode];
                    }
                    return boardEval;
                };
                statObj.countFunc = (boardEval, rawCount, samples, sampleSize, seat) => {
                    // Game is achievable if 26+/28+ TP and 8 trump cards combined. 
                    // Slam is achievable only if it was game-able and either 30+ TP or 12 or less LTC.
                    let pSeat = this.roundSeat(seat+2); // partner
                    if (boardEval.Major > 8) {
                        if (boardEval.TP > 26)
                            ++rawCount['Major Game'];
                        if (boardEval.TP > 30)
                            ++rawCount['Major TP Slam'];
                        if (boardEval.LTC < 13)
                            ++rawCount['Major LTC 12'];
                        if (Math.random() < 0.5 && samples.length < sampleSize)
                            samples.push([JSON.parse(JSON.stringify(this.board.seats[seat].hand)), JSON.parse(JSON.stringify(this.board.seats[pSeat].hand))]);
                    } else if (boardEval.Minor > 8) {
                        if (boardEval.TP > 28)
                            ++rawCount['Minor Game'];
                        if (boardEval.TP > 30)
                            ++rawCount['Minor TP Slam'];
                        if (boardEval.LTC < 13)
                            ++rawCount['Minor LTC 12'];
                    if (Math.random() < 0.5 && samples.length < sampleSize)
                        samples.push([JSON.parse(JSON.stringify(this.board.seats[seat].hand)), JSON.parse(JSON.stringify(this.board.seats[pSeat].hand))]);
                    } else if (Math.random() < 0.2 && samples.length < sampleSize)
                        samples.push([JSON.parse(JSON.stringify(this.board.seats[seat].hand)), JSON.parse(JSON.stringify(this.board.seats[pSeat].hand))]);
                };
                statObj.calcDblBuf = (dblBuf, dblIdx, rawCount) => {
                    dblBuf[dblIdx]['Open'] = rawCount['Open']/rawCount['Dealt'];
                    dblBuf[dblIdx]['Major Game'] = rawCount['Major Game']/rawCount['Open'];
                    dblBuf[dblIdx]['Major TP Slam'] = rawCount['Major TP Slam']/rawCount['Major Game'];
                    dblBuf[dblIdx]['Major LTC 12'] = rawCount['Major LTC 12']/rawCount['Major Game'];
                    dblBuf[dblIdx]['Minor Game'] = rawCount['Minor Game']/rawCount['Open'];
                    dblBuf[dblIdx]['Minor TP Slam'] = rawCount['Minor TP Slam']/rawCount['Minor Game'];
                    dblBuf[dblIdx]['Minor LTC 12'] = rawCount['Minor LTC 12']/rawCount['Minor Game'];
                    // Are we stablized?
                    return Math.abs(dblBuf[dblIdx]['Major Game'] - dblBuf[1-dblIdx]['Major Game']) < this.epsilon &&
                            Math.abs(dblBuf[dblIdx]['Minor Game'] - dblBuf[1-dblIdx]['Minor Game']) < this.epsilon;
                }
                this.workStats(e, s, statObj);
                break;
            default:
                e.insertAdjacentHTML('beforeend', `${s} Not implemented yet<br>`);
                return;
        }
    }

    /*
     * This is the main workhorse for running stats. It runs a loop of
     * dealing random hands and checking if they match the criteria. If they
     * do, it evaluates the hand and updates the counts. It uses a double
     * buffer to check for stabilization of the results and stops when
     * stabilized. If a displayFunc is provided in statObj, it calls that to
     * display the results, otherwise it just shows the raw counts and
     * percentages.
     */
    workStats(e, s, statObj) {
        let samples = [];
        const sampleSize = 10;
        let rawCount = {};
        let dblBuf = [{}, {}]
        for (const k of statObj.colHdrs) {
            rawCount[k] = 0;
            dblBuf[0][k] = 0.0;
            dblBuf[1][k] = 0.0;
        }

        e.insertAdjacentHTML('beforeend', `<p>${statObj.msg}<br>`);
        // grid division for stats display
        let tblDiv = document.createElement('div');
        e.appendChild(tblDiv);
        tblDiv.setAttribute('style', `display: grid; grid-template-columns: repeat(${statObj.colHdrs.length + 1}, auto); gap: 1vw;`);
        let i = 0;
        // column headers, provided by caller
        for (const k of statObj.colHdrs)
            tblDiv.insertAdjacentHTML('beforeend', `<div class="TblHeader" style="grid-column: ${++i}; grid-row: 1;">${k}</div>`);

        let stabilized = false;
        let dblIdx = 0;
        // The running count.  Hardcoded to be the 1st column, 2nd row.
        let rawElem = rawElem = document.createElement('div');
        rawElem.setAttribute('class', 'TblCell');
        rawElem.setAttribute('style', 'grid-column: 1; grid-row: 2;');
        tblDiv.appendChild(rawElem);
        // Use interval to improve UI.
        // Interval is async.  Make sure this is the end of the execution.
        let sid = setInterval(() => {
            let round = 'round' in statObj ? statObj.round : 100;
            while (round-- > 0) {
                let found = false
                let seat = 0;
                let c = 0
                // Keep dealing until we find a hand that matches the criteria.
                do {
                    ++rawCount['Dealt']
                    this.board.deal();
                    for (seat = 0; seat < 4 && !found; ++seat)
                        for (c = 0; c < statObj.toMeet.length && !found; ++c)
                            found = this.matchCriteria(this.board.seats[seat], null, statObj.toMeet[c]);
                } while (!found);
                // Found!
                // Decrement the counter to indext the right element.
                ++rawCount['Open'];
                --seat;
                --c
                let boardEval = statObj.evalFunc(seat, c, this.board);
                statObj.countFunc(boardEval, rawCount, samples, sampleSize, seat);
            }
            stabilized = statObj.calcDblBuf(dblBuf, dblIdx, rawCount);
            dblIdx = 1 - dblIdx;    // flip
            rawElem.innerHTML= `${rawCount['Dealt']}`;
            // Done.  First stop the interval, then display the results.
            if (stabilized) {
                clearInterval(sid);
                if ('displayFunc' in statObj)
                    statObj.sampleFunc(e, dblBuf);
                else {
                    for (i = 1; i < statObj.colHdrs.length; ++i)
                        tblDiv.insertAdjacentHTML('beforeend', `<div class="TblCell" style="grid-column: ${i+1}; grid-row: 2;">${rawCount[statObj.colHdrs[i]]}</div>`);
                    for (i = 1; i < statObj.colHdrs.length; ++i)
                        tblDiv.insertAdjacentHTML('beforeend', `<div class="TblCell" style="grid-column: ${i+1}; grid-row: 3;">${(100*dblBuf[dblIdx][statObj.colHdrs[i]]).toFixed(2)}%</div>`);
                    let row = 1
                    e.insertAdjacentHTML('beforeend', '<p>Sample Hands:<br>');
                    let sampleDiv = document.createElement('div');
                    e.appendChild(sampleDiv);
                    sampleDiv.setAttribute('style', `display: grid; grid-template-columns: 3vw 15vw 15vw; gap: 1vw;`);
                    for (const s of samples) {
                        let col = 1;
                        sampleDiv.insertAdjacentHTML('beforeend', `<div style="grid-column: 1; grid-row: ${row};">${row}</div>`);
                        for (const h of s) {
                            let hObj = new Hand(h);
                            let hStr = hObj.toString();
                            sampleDiv.insertAdjacentHTML('beforeend', `<div style="grid-column: ${++col}; grid-row: ${row};">${hStr}</div>`);
                        }
                        ++row;
                    }
                }
            }}, 100);
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
function Simulate(e) { simModule.action(simModule.SimulateMap); }
function RunStat(e) { simModule.action(simModule.StatsMap); }