/*
 * Sin-Yaw Wang, 2026
 * "Simulate" generates hands that meet certain requirements.
 * "Statistics" generates large number of boards for certain criteria and analyze their properites.
 */
class BridgeStats extends SimStats {
    TIMER = 100;   // ms. Adjust as needed to balance UI and speed.

    constructor(menuId) {
        super()
        this.epsilon = 0.00005;  // stabilization threshold for stats.  If the percentage change is less than this, we consider it stabilized.
        this.sampleSize = 16;
        // Things we handle.
        // What we will generate simulated hands that meet the criteria for the bidding sequences.
        // Things we will calculate states.
        this.StatsMap = {'Name': 'Statistics',
            '5-4': {'PreCheck': [{HCP: 16, Shape: '5-4'}, {HCP: 11, Shape: '5-4'}],
                'Columns': ['Dealt', 'Open', 'Normal', 'Strong'],
                'Msg': ''},
            '5-5': {'PreCheck': [{HCP: 16, Shape: '5-5'}, {HCP: 11, Shape: '5-5'}],
                'Columns': ['Dealt', 'Open', 'Normal', 'Strong'],
                'Msg': ''},
            '5M-6m': {'PreCheck': [{HCP: 11, SuitLen: {'S': 5, 'D': 6}},
                    {HCP: 11, SuitLen: {'S': 5, 'C': 6}},
                    {HCP: 11, SuitLen: {'H': 5, 'D': 6}},
                    {HCP: 11, SuitLen: {'H': 5, 'C': 6}}],
                    'Columns': ['Dealt', 'Open', 'Major Game', 'Major TP Slam', 'Major LTC 12', 'Minor Game', 'Minor TP Slam', 'Minor LTC 12'],
                    'Msg': 'Stats for 6-card minor and 5-card major hands with 12+ HCP.'
                }};

        this.initDisplay()
        if (Config.WorkingSet == undefined || Config.WorkingSet == null) {
            Config.getDefaults();
            Config.makeBidRules();
        }
        this.makeDynamicMap();
        let menuSet = Object.keys(this.StatsMap).filter(v => v != 'Name');
        const e = document.getElementById(menuId);
        this.makeSelect(e, 'Scenario: ', 'Scenario', menuSet);
        this.board = new Board(new Deck());
    }

    makeDynamicMap() {
        this.StatsMap['Open'] = {'PreCheck': [], 'Columns': ['Dealt', 'Open']};
        let openBids = Config.WorkingSet.Rules.Open.Bids;
        openBids.forEach(bid => {
            this.StatsMap['Open']['PreCheck'].push(bid.Criteria[0]);
            this.StatsMap['Open']['PreCheck'].at(-1)['Bid'] = bid.Bid;
            this.StatsMap['Open']['Columns'].push(bid.Bid);
        });
        this.StatsMap['Open']['Msg'] = `Stats for Opening`;
    }
    /* Trasition from click handler to class method.
     * Caller decided which map, we use the selected value to dispatch the work.
     */
    action(map) {
        var e = document.getElementById('ListDisplay');
        clearContents(e)
        this.initDisplay()
        this.doStats(document.getElementById('SimStat'), bStats.scenario.value);
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
        var statObj = {'colHdrs': this.StatsMap[s]['Columns'], 'msg': this.StatsMap[s]['Msg']};
        switch (s) {
            case 'Open':
                statObj.evalFunc = (seat, cIdx, board) => {
                    return this.StatsMap[s]['PreCheck'][cIdx].Bid;
                }
                statObj.countFunc = (openBid, rawCount, samples, seat) => {
                    ++rawCount[openBid];
                    if (!Object.hasOwn(statObj, 'Counter'))
                        statObj.Counter = Array(statObj.colHdrs.length-2).fill(0);
                    let idx = this.StatsMap[s].Columns.indexOf(openBid)-2;
                    let minCount = Math.min(...statObj.Counter);
                    if (statObj.Counter[idx] <= minCount && samples.length < this.sampleSize)
                        this.pushSample(samples, seat, 4, null);
                    ++statObj.Counter[idx];
                        
                };
                statObj.calcDblBuf = (dblBuf, dblIdx, rawCount) => {
                    for (const k of Object.keys(rawCount))
                            dblBuf[dblIdx][k] = rawCount[k]/rawCount['Open'];
                    dblBuf[dblIdx]['Open'] = rawCount['Open']/rawCount['Dealt'];
                    let ret = true;
                    for (const k of Object.keys(rawCount)) {
                        if (k != 'Dealt' && k != 'Open') {
                            ret &&= Math.abs(dblBuf[dblIdx][k] - dblBuf[1-dblIdx][k]) < this.epsilon
                            if (!ret)
                                break;
                        }
                    }
                    return ret;
                }
                break;
            case '5-4':
            case '5-5':
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
                            this.pushSample(samples, seat, 4, null);
                    } else {
                        rawCount['Strong']++;
                        if (Math.random() < 0.5 && samples.length < this.sampleSize)
                            this.pushSample(samples, seat, 4, null);
                    }
                };
                statObj.calcDblBuf = (dblBuf, dblIdx, rawCount) => {
                    dblBuf[dblIdx]['Open'] = rawCount['Open']/rawCount['Dealt'];
                    dblBuf[dblIdx]['Normal'] = rawCount['Normal']/rawCount['Open'];
                    dblBuf[dblIdx]['Strong'] = rawCount['Strong']/rawCount['Open'];
                    // Are we stablized?
                    return Math.abs(dblBuf[dblIdx]['Normal'] - dblBuf[1-dblIdx]['Normal']) < this.epsilon;
                }
                break;
            case '5M-6m':
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
                            this.pushSample(samples, seat, 4, null);
                    } else if (boardEval.Minor > 8) {
                        if (boardEval.TP > 28)
                            ++rawCount['Minor Game'];
                        if (boardEval.TP > 30)
                            ++rawCount['Minor TP Slam'];
                        if (boardEval.LTC < 13)
                            ++rawCount['Minor LTC 12'];
                    if (Math.random() < 0.5 && samples.length < this.sampleSize)
                        this.pushSample(samples, seat, 4, null);
                    } else if (Math.random() < 0.2 && samples.length < this.sampleSize)
                        this.pushSample(samples, seat, 4, null);
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
                break;
        }
        this.workStats(e, s, statObj);
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

        e.insertAdjacentHTML('beforeend', `<h2>${statObj.msg}</h2>`);
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
                        for (c = 0; c < this.StatsMap[s].PreCheck.length && !found; ++c) {
                            let pre = this.StatsMap[s].PreCheck[c];
                            found = this.matchCriteria(this.board.seats[seat],
                                Object.hasOwn(pre, 'Bid') ? pre.Bid : null, pre);
                        }
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

}

// Click handlers
function RunStat(e) { bStats.action(bStats.StatsMap); }
