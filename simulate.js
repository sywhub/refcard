/*
 * Sin-Yaw Wang, 2026
 * "Simulate" generates hands that meet certain requirements.
 * "Statistics" generates large number of boards for certain criteria and analyze their properites.
 */
class SimStat extends BidSystem {
    constructor(menuId) {
        super()
        this.epsilon = 0.00005;  // stabilization threshold for stats.  If the percentage change is less than this, we consider it stabilized.
        this.sampleSize = 16;
        // Things we handle.
        // What we will generate simulated hands that meet the criteria for the bidding sequences.
        // Simulations have other fitlers coded elsewhere.
        this.SimulateMap = {'Name': 'Simulate',
            '1NT Interference': {'PreCheck': [{'HCP': [8, 12], 'SuitLen': {'S': 5}, 'AnySuit': {'D': 4, 'C': 4}},
                {'HCP': [8, 12], 'SuitLen': {'H': 5}, 'AnySuit': {'D': 4, 'C': 4}},
                {'HCP': [8, 12], 'SuitLen': {'D': 5, 'C': 5}},
                {'HCP': [8, 12], 'AnySuit': {'S': 6, 'H': 6, 'D': 6, 'C': 6}},
                {'HCP': [8, 12], Shape: '5-4', 'SuitLen': {'S': 4, 'H': 4}},
                {'HCP': [13, 16], 'Shape': 'Balanced'}],
                'Caption': 'Sample hands that meet the criteria for interference after opponent opened 1NT.',
                 'PostFilter': null, 'Samples': 0},
            'Slam Try': {'PreCheck': [{'HCP': 17, 'AnySuit': {'S': 4, 'H': 4}, 'SuitLen': {'D': 5}},
                {'HCP': 17, 'AnySuit': {'S': 4, 'H': 4}, 'SuitLen': {'C': 5}}],
                'Caption': 'Potential Slam with 4:M and 5+:m',
                'PostFilter': (board, seat) => {
                    let pSeat = this.roundSeat(seat+2);
                    return (board.seats[seat].HCP + board.seats[pSeat].HCP >= 26);}, 'Samples': 4},
            '2C with Minor': {'PreCheck': [{'HCP': 22, 'AnySuit': {'D': 5, 'C': 5}}],
                'Caption': '2C with Minor, partner matches',
                'PostFilter': (board, seat) => {
                    let pSeat = this.roundSeat(seat+2);
                    return board.seats[pSeat].HCP >= 6 && board.seats[pSeat].HCP <= 10 && 
                        ((board.seats[seat].Suits[Card.Codes['D']-1] + board.seats[pSeat].Suits[Card.Codes['D']-1] >= 8) ||
                        (board.seats[seat].Suits[Card.Codes['C']-1] + board.seats[pSeat].Suits[Card.Codes['C']-1] >= 8));}, 'Samples': 4},
            'Tragic Partial': {'PreCheck': [{'HCP': [10, 14], 'AnySuit': {'S': 6, 'H': 6, 'D': 6, 'C': 6}}],
                 'Caption': 'Sample hands for Tragic Partial',
                'PostFilter': (board, seat) => {
                    let pSeat = this.roundSeat(seat+2);
                    let totalHCP = board.seats[seat].HCP + board.seats[pSeat].HCP;
                    // The tragic.
                    // Enough strength, no fit.
                    return (totalHCP >= 22 && totalHCP <= 25) &&
                        ((board.seats[seat].Suits[Card.Codes['S']-1] + board.seats[pSeat].Suits[Card.Codes['S']-1] < 8) &&
                        (board.seats[seat].Suits[Card.Codes['H']-1] + board.seats[pSeat].Suits[Card.Codes['H']-1] < 8) &&
                        (board.seats[seat].Suits[Card.Codes['D']-1] + board.seats[pSeat].Suits[Card.Codes['D']-1] < 8) &&
                        (board.seats[seat].Suits[Card.Codes['C']-1] + board.seats[pSeat].Suits[Card.Codes['C']-1] < 8));}, 'Samples': 4},
            '2/1 Responses to 1NT': {'PreCheck': [], // to extract from rules
                 'Caption': 'Sample hands for 1M Opener rebid after partner\'s 1NT response',
                 'PostFilter': null, 'Samples': 0},
            '1M': {'BidSeq': [['1S', '-'],['1H', '-']]},
            '1m': {'BidSeq': [['1D', '-'],['1C', '-']]},
            '1NT': {'BidSeq': [['1NT', '-']]},
            'Preempt':{'BidSeq': [['2S', '-'],['2H', '-'],['2D', '-']]}};
        // Things we will calculate states.
        this.StatsMap = {'Name': 'Statistics',
            '5-4': {'PreCheck': [{HCP: 16, Shape: '5-4'}, {HCP: 11, Shape: '5-4'}]},
            '5-5': {'PreCheck': [{HCP: 16, Shape: '5-5'}, {HCP: 11, Shape: '5-5'}]},
            '5M-6m': {'PreCheck': [{HCP: 11, SuitLen: {'S': 5, 'D': 6}},
                    {HCP: 11, SuitLen: {'S': 5, 'C': 6}},
                    {HCP: 11, SuitLen: {'H': 5, 'D': 6}},
                    {HCP: 11, SuitLen: {'H': 5, 'C': 6}}]}};

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
            this.simMakeCriteria(null, '2/1 Responses to 1NT');
        }
        var e = document.getElementById('ListDisplay');
        clearContents(e)
        this.initDisplay()
        e = document.getElementById('SimStat');
        var scenario = simModule.scenario.value;
        if (scenario in map) {
            let cases = map[scenario];
            if (map.Name == 'Simulate') {
                this.doSimulate(e, scenario);
            } else if (map.Name == 'Statistics') {
                this.doStats(e, scenario);
            }
        } else 
            e.insertAdjacentHTML('beforeend', `${map.Name} does not handle ${scenario}<br>`);
    }

    // Check if the hand meets the criteria.
    // Bid is used only when SuitLen did not spcifiy the suit and "Control".
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
                case 'Honors':
                    let check = {}
                    if (typeof(v) == 'object') 
                        check = v;
                    else
                        check = {[bid.at(-1)]: v};
                    for (const [s, h] of Object.entries(check)) { 
                        met = h <= hand.Honors[Card.ltr2code(s) - Card.Club()];
                        if (!met)
                            break;
                    }
                    break;
                case 'Control':
                case 'Stopper':
                    let suitList = [v];
                    if (k == 'Control')
                        suitList = [bid];
                    else if (Array.isArray(v))
                        suitList = [...v];
                    for (const s of v) {
                        let suitCode = Card.ltr2code(s);
                        let suitCards = hand.hand.filter(x => x.suit == suitCode);
                        met = k == 'Control' && suitCards.length == 0;
                        if (!met || k == 'Stopper')
                            met = (suitCards.length >= 4 && suitCards[0].rank == Card.Jack) ||
                                (suitCards.length >= 3 && (suitCards[0].rank == Card.Queen && suitCards[1].rank == Card.Jack)) ||
                                (suitCards.length >= 2 && (suitCards[0].rank == Card.King && suitCards[1].rank == Card.Queen)) ||
                                (suitCards.length >= 1 && suitCards[0].rank == Card.Ace);
                        if (!met)
                            break;
                    }
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
                case 'AnySuit':
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
                            if (k == 'SuitLen' && !met)
                                break;
                            else if (k == 'AnySuit' && met)
                                break;
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

    pushSample(samples, seat, handChoice = 4) {
        let sampleHand = [];
        let inc = 1;
        if (handChoice == 2) 
            inc = 2;
        else if (handChoice == 0)
            inc = 4;
        for (let i = 0; i < 4; i +=inc) {
            let sIdx = this.roundSeat(seat+i);
            sampleHand.push(JSON.parse(JSON.stringify(this.board.seats[sIdx].hand)));
        }
        samples.push(sampleHand);
    }

    // Dispatcher for statistics calculations.
    // Construct the data structure and pass it to the workhorse function.
    doStats(e, s) {
        /*
         * state object:
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
            case '5-4':
            case '5-5':
                statObj.colHdrs = ['Dealt', 'Open', 'Normal', 'Strong'];
                statObj.msg = `Stats for ${s} hands with open strength.`;
                statObj.evalFunc = (seat, cIdx, board) => {
                    let e = {'HCP': board.seats[seat].HCP};
                    return e;
                }
                statObj.countFunc = (boardEval, rawCount, samples, seat) => { 
                    let pSeat = this.roundSeat(seat+2); // partner
                    if (boardEval.HCP < 16) {
                        rawCount['Normal']++;
                        if (Math.random() < 0.2 && samples.length < this.sampleSize)
                            this.pushSample(samples, seat);
                    } else {
                        rawCount['Strong']++;
                        if (Math.random() < 0.5 && samples.length < this.sampleSize)
                            this.pushSample(samples, seat);
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
                statObj.colHdrs = ['Dealt', 'Open', 'Major Game', 'Major TP Slam', 'Major LTC 12', 'Minor Game', 'Minor TP Slam', 'Minor LTC 12'];
                statObj.msg = 'Stats for 6-card minor and 5-card major hands with 12+ HCP. For each hand, check if game or slam is achievable.';
                statObj.evalFunc = (seat, cIdx, board) => {
                    var boardEval = {};
                    let pSeat = this.roundSeat(seat+2); // partner
                    boardEval['HCP'] = board.seats[seat].HCP + board.seats[pSeat].HCP;
                    boardEval['TP'] = board.seats[seat].TP + board.seats[pSeat].TP;
                    boardEval['LTC'] = board.seats[seat].LTC + board.seats[pSeat].LTC;
                    for (const k of Object.keys(this.StatsMap[s].PreCheck[cIdx].SuitLen)) {
                        let key = ['S', 'H'].includes(k) ? 'Major' : 'Minor';
                        let suitCode = Card.ltr2code(k) - Card.Club();
                        boardEval[key] = 
                            board.seats[seat].Suits[suitCode] + board.seats[pSeat].Suits[suitCode];
                    }
                    return boardEval;
                };
                statObj.countFunc = (boardEval, rawCount, samples, seat) => {
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
                        if (Math.random() < 0.5 && samples.length < this.sampleSize)
                            this.pushSample(samples, seat);
                    } else if (boardEval.Minor > 8) {
                        if (boardEval.TP > 28)
                            ++rawCount['Minor Game'];
                        if (boardEval.TP > 30)
                            ++rawCount['Minor TP Slam'];
                        if (boardEval.LTC < 13)
                            ++rawCount['Minor LTC 12'];
                    if (Math.random() < 0.5 && samples.length < this.sampleSize)
                        this.pushSample(samples, seat);
                    } else if (Math.random() < 0.2 && samples.length < this.sampleSize)
                        this.pushSample(samples, seat);
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
        let rawElem = document.createElement('div');
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
                        for (c = 0; c < this.StatsMap[s].PreCheck.length && !found; ++c)
                            found = this.matchCriteria(this.board.seats[seat], null, this.StatsMap[s].PreCheck[c]);
                } while (!found);
                // Found!
                // Decrement the counter to indext the right element.
                ++rawCount['Open'];
                --seat;
                --c
                let boardEval = statObj.evalFunc(seat, c, this.board);
                statObj.countFunc(boardEval, rawCount, samples, seat);
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
                    this.showSamples(e, samples, "Samples of hands that meet the criteria.");
                }
            }}, 100);
    }

    // Display the samples
    // Samples all assumes the 1st seat to open, 3rd being its partner.
    showSamples(e, samples, description) {
        // First display on the screen.
        // Then generate the LIN lines for BBO.
        let row = 1;
        let bIdx = 1;
        e.insertAdjacentHTML('beforeend', `<p>${description}<br>`);
        let sampleDiv = document.createElement('div');
        e.appendChild(sampleDiv);
        sampleDiv.setAttribute('style', `display: grid; grid-template-columns: 3vw repeat(4, 15vw); gap: 1vw;`);
        for (const s of samples) {
            // Show only North and South
            sampleDiv.insertAdjacentHTML('beforeend', `<div style="grid-column: 1; grid-row: ${row};">${bIdx++}.</div>`);
            let sNext = [0];
            if (s.length > 2) 
                sNext.push(2);
            else if (s.length > 1) 
                sNext.push(1);
            let colIdx = 2;
            for (const sIdx of sNext) {
                let hObj = new Hand(s[sIdx]);
                let hStr = hObj.toString();
                sampleDiv.insertAdjacentHTML('beforeend', `<div style="grid-column: ${colIdx++}; grid-row: ${row};">${hStr}</div>`);
            }
            ++row;
        }

        /*
         * LIN output.
         * first "qx|o<n>|pn|S,W,N,E|st||md|<dealer>".  Dealer is the nth hand following.
         *   1 => South, 2 => West, 3 => North, 4 => East.
         * Then the hand for each seat: <Suit><Cards>, separated by comma.  Suit is S, H, D, C.  Cards are AKQJT98765432.  The 4th
         * seat can be omitted, BBO will fill in what's left.
         * Lastly, ends with "sv|<vul>|ah||rh|<description>|pg||".  Vul is o, n, e, b.
         * "qx|o<n>" must be consecutive.  "Dealer" must be sequential relative to the "o" number.
         */
        if (samples.length < 0 || samples[0].length < 4)
            return;

        let linDiv = document.createElement('div');
        e.appendChild(linDiv);
        linDiv.insertAdjacentHTML('beforeend', '<p>BBO LIN:<br>');
        bIdx = 0;
        let vul = ['o', 'n', 'e', 'b'];
        let bboDiv = document.createElement('div');
        bboDiv.setAttribute('class', 'BBOLin')
        bboDiv.setAttribute('id', 'BBOLin')
        linDiv.appendChild(bboDiv);
        for (const s of samples) {
            let bbo = `qx|o${bIdx+1}|pn|S,W,N,E|st||md|${(bIdx+2)%4+1}`;
            let hString = '';
            // N or S are always the 1st or 2nd seat.
            // Arrange the hands so tha they are always the opening hand.
            let hIdx = [2, 0, 0, 2][bIdx%4];
            // Display all 4 hands.
            for (let i = 0; i < 4; i++) {
                let hObj = new Hand(s[(hIdx+i)%4]);
                hString = hObj.toString();
                hString = hString.replaceAll('10', 'T');
                for (const c of ['S', 'H', 'D', 'C']) 
                    hString = hString.replaceAll(`${Card.cHTML[Card.Codes[c]]}`, c);
                hString = hString.replaceAll(' ', '');
                bbo += `${hString},`;
            }
            let v = vul[(bIdx+Math.floor((bIdx)/4))%4];
            bbo = bbo.slice(0, -1); // remove the last comma
            bbo += `|rh||ah|Board ${bIdx+1}|sv|${v}|pg||` // the ending
            bboDiv.insertAdjacentHTML('beforeend', `${bbo}<br>`);
            ++bIdx;
        }
    }

    doSimulate(e, scenario) {
        let sampleText = '';
        let samples = null;
        if ('PreCheck' in this.SimulateMap[scenario]) {
                sampleText = this.SimulateMap[scenario].Caption;
                samples = this.workSimulation(e, scenario, this.SimulateMap[scenario].PostFilter, this.SimulateMap[scenario].Samples);
        } else if ('BidSeq' in this.SimulateMap[scenario]) {
            var cases = this.SimulateMap[scenario].BidSeq;
            samples = [];
            let count = new Array(cases.length).fill(0);
            sampleText = `Sample Hands for ${cases.map(c => this.seqString(c)).join(', ')}`;
            while (samples.length < this.sampleSize) {
                let i = Math.floor(Math.random() * count.length);
                let caseRules = null
                if (seqKey(cases[i]) in Config.WorkingSet.Rules)
                    caseRules = Config.WorkingSet.Rules[seqKey(cases[i])];
                if (!caseRules || caseRules.Bids.length <= 0)
                    continue;

                let maxSpread = Math.max(...count);
                let nMax = count.filter(s => s == maxSpread).length;
                if (!(nMax == count.length || count[i] < maxSpread))
                    continue;

                let bids = caseRules.Bids.filter(b => b.Criteria.length > 0);
                let bIdx = Math.floor(Math.random() * bids.length);
                let b = bids[bIdx];
                let [seat, options] = this.findSeqMatch(caseRules.Seq, b.Bid);
                if (seat != null) 
                    this.pushSample(samples, seat, 2);

                count[i]++;
            }
        }
        this.showSamples(e, samples, sampleText);
    }

    // Extract the critreria from the bidding rules.
    simMakeCriteria(e, caseName) {
        // Just once
        if (this.SimulateMap[caseName].PreCheck.length <= 0 && caseName == '2/1 Responses to 1NT') {
            // Specific rules to extract
            let thurstonRules = BidComponents
                .filter(c => c.Flag == 'PThurston21')[0].Rules
                    .filter(r => ['1Sp1NTp', '1Hp1NTp'].includes(seqKey(r.Seq)));
            let criteria = this.SimulateMap[caseName].PreCheck;  // JS is shallow copy. This is a pointer.
            for (let bids of thurstonRules) {
                let cKey = bids.Seq[0].at(-1);  // Open suit
                for (let b of bids.Bids) {
                    if  (b.Criteria.length > 0) {
                        let suit = b.Bid.at(-1);    // Bid suit
                        let c = JSON.parse(JSON.stringify(b.Criteria[0])); // make copy
                        // To make criteria generic, add the open suit (a major) to SuitLen
                        if ('SuitLen' in c) { 
                            if (typeof(c.SuitLen) != 'object')
                                c.SuitLen = {[suit]: c.SuitLen};
                            if (suit != cKey)
                                c.SuitLen[cKey] = 5;
                        } else 
                            c.SuitLen = {[cKey]: 5};
                        criteria.push(c);
                    }
                }
            }
        }
    }


    // Generic Simulation hand generator
    workSimulation(e, caseName, filterFunc, pushPartner = false) {
        // The hands we are interested.
        let criteria = this.SimulateMap[caseName].PreCheck;
        let samples = [];
        let spread = new Array(criteria.length).fill(0);    // Every criteria get a fair share.
        while (samples.length < this.sampleSize) {
            this.board.deal();
            let found = false;
            for (let seat = 0; seat < 4 && !found; ++seat) {
                for (let c = 0; c < criteria.length && !found; ++c) {
                    found = this.matchCriteria(this.board.seats[seat], null, criteria[c]);
                    if (found) {
                        let maxSpread = Math.max(...spread);
                        let nMax = spread.filter(s => s == maxSpread).length;
                        found = nMax == spread.length || spread[c] < maxSpread;
                        if (filterFunc != null)
                            found = found && filterFunc(this.board, seat);
                        if (found) {
                            this.pushSample(samples, seat, pushPartner);
                            spread[c]++;
                        }
                    }
                }
            }
        }
        return samples;
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
function SaveToFile(e) {
    var e = document.getElementById('BBOLin');
    if (e != null) 
        DownLoadToFile('BBOLin.lin', 'BBOLin', 'BBO LIN Format');
    else {
        e = document.getElementById('SimStat');
        let txt = e.innerText.replaceAll('.\n', '. ');
        for (const [c,sym] of Object.entries({'S': '\u2660', 'H': '\u2665', 'D': '\u2666', 'C': '\u2663'})) 
            txt = txt.replaceAll(`${sym}`, `${c}:`);
        e = document.createElement('div');
        e.setAttribute('id', 'SimStatTxt');
        e.innerText = txt;
        document.body.appendChild(e);
        DownLoadToFile('SimulatedHands.txt', 'SimStatTxt', 'Simulated Hands');
        e.remove();
    }
}