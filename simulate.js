/*
 * Sin-Yaw Wang, 2026
 * "Simulate" generates hands that meet certain requirements.
 * "Statistics" generates large number of boards for certain criteria and analyze their properites.
 */
class SimStat extends SimStats {
    TIMER = 100;   // ms. Adjust as needed to balance UI and speed.

    constructor(menuId) {
        super()
        this.epsilon = 0.00005;  // stabilization threshold for stats.  If the percentage change is less than this, we consider it stabilized.
        this.sampleSize = 16;
        // Things we handle.
        // What we will generate simulated hands that meet the criteria for the bidding sequences.
        // Simulations have other fitlers coded elsewhere.
        this.SimulateMap = {'Name': 'Simulate',
            'DONT or Cappelletti': {'BidSeq': [['1NT']],
                'Caption': 'RHO opened 1NT'},
            'Slam Try': {'PreCheck': [{'HCP': 17, 'AnySuit': {'S': 4, 'H': 4}, 'SuitLen': {'D': 5}},
                {'HCP': 17, 'AnySuit': {'S': 4, 'H': 4}, 'SuitLen': {'C': 5}}],
                'Caption': 'Potential Slam with 4:M and 5+:m',
                'PostFilter': (board, seat) => {
                    let pSeat = this.roundSeat(seat+2);
                    return (board.seats[seat].HCP + board.seats[pSeat].HCP >= 26);}, 'Samples': 4},
            '2C with Minor': {'PreCheck': [{'HCP': 22, 'AnySuit': {'D': 5, 'C': 5}}],
                'Caption': '2C with a Minor suit match',
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
            '2/1 Responses to 1NT': {'Extract': ['P. Thurston 2/1', ['1Sp1NTp', '1Hp1NTp']],
                 'Caption': 'Sample hands for 1M Opener rebid after partner\'s 1NT response'},
            'Lebensohl 1NT': {'BidSeq': [['1NT', '2D'], ['1NT', '2H'], ['1NT', '2S']]},
            'Lebensohl 2x': {'BidSeq': [['2D', 'X', '-'], ['2H', 'X', '-'], ['2S', 'X', '-']]},
            /* infinitie loop
            'NMF': {'BidSeq': [
                        ['1C', '-', '1H', '-', '1NT', '-'],
                        ['1C', '-', '1S', '-', '1NT', '-'],
                        ['1D', '-', '1H', '-', '1NT', '-'],
                        ['1D', '-', '1S', '-', '1NT', '-']]},
            */
            '1m Strong Reply': {'BidSeq': [['1D', '-'], ['1C', '-']],
                'PostFilter': (board, seat) => {
                    return board.seats[seat].HCP >= 7 && board.seats[seat].HCP <= 15;}},
            '1m Weak Reply': {'BidSeq': [['1D', '-'], ['1C', '-']],
                'PostFilter': (board, seat) => {
                    return board.seats[seat].HCP <= 6;}},
            'Michaels&U2NT': {'BidSeq': [['1S'], ['1H'], ['1C'], ['1D']],
                'PostFilter': (board, seat) => {
                    return board.seats[seat].HCP >= 6 && board.seats[seat].Suits.filter(s => s == 5).length == 2;}},
            'Ogust': {'PreCheck': [{'HCP': [6, 11], 'SuitLen': {'S': 6}, 'Meta': {'Annotation': ['2S', '-', '2NT', '-']}},
                                    {'HCP': [6, 11], 'SuitLen': {'H': 6}, 'Meta': {'Annotation': ['2H', '-', '2NT', '-']}},
                                    {'HCP': [6, 11], 'SuitLen': {'D': 6}, 'Meta': {'Annotation': ['2D', '-', '2NT', '-']}}],
                    'Caption': 'Sample hands for Ogust'},
            '8.5 tricks': {'PreCheck': [{'HCP': [11, 14], 'AnySuit': {'D': 5, 'C': 5}}],
                'PostFilter': (board, seat) => {
                    let pSeat = this.roundSeat(seat+2);
                    return (board.seats[pSeat].LTC + board.seats[pSeat].LTC == 15 || board.seats[pSeat].LTC + board.seats[pSeat].LTC == 16) &&
                        (board.seats[pSeat].HCP + board.seats[pSeat].HCP == 25 || board.seats[pSeat].HCP + board.seats[pSeat].HCP == 26);
                }, 'Samples': 4}
            };

        this.initDisplay()
        let menuSet = Object.keys(this.SimulateMap).filter(v => v != 'Name');
        const e = document.getElementById(menuId);
        this.makeSelect(e, 'Scenario: ', 'Scenario', menuSet);
        this.board = new Board(new Deck());
    }


    /* Trasition from click handler to class method.
     * Caller decided which map, we use the selected value to dispatch the work.
     */
    action(map) {
        if (Config.WorkingSet == undefined || Config.WorkingSet == null) {
            Config.getDefaults();
            Config.makeBidRules();
            this.simMakeCriteria();
        }
        var e = document.getElementById('ListDisplay');
        clearContents(e)
        this.initDisplay()
        e = document.getElementById('SimStat');
        var scenario = simModule.scenario.value;
		let cases = map[scenario];
		this.doSimulate(e, scenario);
    }



    doSimulate(e, scenario) {
        // Generate the hand that meet certain criteria.
        // The post-filter other creteria.
        this.resetCounter();
        const map = this.SimulateMap[scenario];
        let sampleText = map.Caption;
        if (sampleText == null) {
            if ('BidSeq' in map)
                sampleText = `Sample Hands for ${map.BidSeq.map(c => this.seqString(c)).join(', ')}`;
            else
                sampleText = scenario;
        }
        e.insertAdjacentHTML('beforeend', `<p>${sampleText}<br>`);
        let sampleDiv = document.createElement('div');
        sampleDiv.setAttribute('id', 'SamplesContents');
        e.appendChild(sampleDiv);

        if ('PreCheck' in map)
            this.simPreCheck(e, scenario, map.Samples);
        else if ('BidSeq' in map)
            this.simBidSeq(e, scenario);
    }

    // Simulation hand generator for bidding sequences.
    simFinalize(e, sid, samples, beginTime, averageCount) {
        clearInterval(sid);
        let duration = new Date() - beginTime;
        e.insertAdjacentHTML('beforeend', `<p>Found ${samples.length} samples in ${duration/1000} seconds.<br>`);
        e.insertAdjacentHTML('beforeend', `<p>Checked ${this.totalDealt} random boards<br>`);
        e.insertAdjacentHTML('beforeend', `<p>Average ${averageCount.toFixed(2)} per ${this.TIMER}ms<br>`);
        this.showBBOLin(e, samples);
    }

    simBidSeq(e, scenario) {
        const MAXATTEMPTS = 100;
        // Generate the hand for the "next" seat after a bidding sequence.
        // Mostly to pratice conventions.
        var cases = this.SimulateMap[scenario].BidSeq;  // bidding sequences to simulate.
        var beginTime = new Date();
        var spreads = new Array(cases.length);
        for (let x = 0; x < cases.length; x++) 
            spreads[x] = new Set();
        var seenCases = new Set();  // to track the cases we have seen, to help spread out the samples.
        var samples = [];
        var attempts = new Array(cases.length).fill(0);
        var timerCount = 1;
        var loopCount = 0;
        var sid = setInterval(() => {
            let intStart = new Date();
            let oneLoop = 0;
            while (oneLoop < this.TIMER && samples.length < this.sampleSize) {
                // Fast exit
                let i = Math.floor(Math.random() * cases.length);
                if (seenCases.has(i))
                    continue;
                seenCases.add(i);
                if (seenCases.size >= cases.length)
                    seenCases.clear();
                let sKey = seqKey(cases[i]); 
                if (!(sKey in Config.WorkingSet.Rules))
                    continue;

                let caseRules = Config.WorkingSet.Rules[sKey];
                let seat = this.findSeqMatch(caseRules.Seq);
                if (seat == null)   // can't find a board that match the bidding sequence. After many reshuffles.
                    continue;

                seat = this.roundSeat(seat+cases[i].length);    // the seat who is to bid next
                let found = false;
                let hasPostFilter = 'PostFilter' in this.SimulateMap[scenario] && this.SimulateMap[scenario].PostFilter != null;
                // Loop through all possible bids to find one that match this hand.
                for (let k = 0; k < caseRules.Bids.length && !found; k++) {
                    if (!hasPostFilter && spreads[i].has(k))  // seen this bid already
                        continue;
                    for (let c = 0; c < caseRules.Bids[k].Criteria.length && !found; c++)
                        found = this.matchCriteria(this.board.seats[seat], null, caseRules.Bids[k].Criteria[c]);

                    found &&= !hasPostFilter || this.SimulateMap[scenario].PostFilter(this.board, seat);

                    if (found) {
                        // A new kind.  Good.
                        // Record that hand, housekeep the distribution.
                        let idx = this.pushSample(samples, seat,
                            'Samples' in this.SimulateMap[scenario] ? this.SimulateMap[scenario].Sample : 0,
                            this.seqString(cases[i]));
                        this.showOneSample(e, samples, idx);

                        if (!hasPostFilter) {
                            spreads[i].add(k);
                            if (spreads[i].size >= caseRules.Bids.length)
                                spreads[i].clear();
                        }
                        attempts[i] = 0;
                    } else 
                        attempts[i]++;

                    // Give up after so many attempts
                    // Allow it next iteration.
                    if (attempts[i] >= MAXATTEMPTS) {
                        spreads[i].clear();
                        attempts[i] = 0;
                    }
                }
                oneLoop = new Date() - intStart;
                ++loopCount;
            } 
            if (samples.length >= this.sampleSize)
                this.simFinalize(e, sid, samples, beginTime, loopCount/timerCount);
            else
                ++timerCount;
        }, this.TIMER);
    }

    // Extract the critreria from the bidding rules.
    simMakeCriteria() {
        // Just once
        for (const caseName of Object.keys(this.SimulateMap)) {
            if (typeof(this.SimulateMap[caseName]) != 'object' || !('Extract' in this.SimulateMap[caseName]))
                continue;
            let compName = this.SimulateMap[caseName].Extract[0];
            let ruleKeys = this.SimulateMap[caseName].Extract[1];
            // Specific rules to extract
            let compRules = BidComponents
                .filter(c => c.Name == compName)[0].Rules
                .filter(r => ruleKeys.includes(seqKey(r.Seq)));
            
            this.SimulateMap[caseName].PreCheck = [];  // JS is shallow copy. This is a pointer.
            for (let bids of compRules) {
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
                        c['Meta'] = {'PreCheckHint': [...bids.Seq, b.Bid]};  // for debugging
                        this.SimulateMap[caseName].PreCheck.push(c);
                    }
                }
            }
            delete this.SimulateMap[caseName].Extract;
        }
    }


    // Generic Simulation hand generator
    simPreCheck(e, caseName, pushPartner = false) {
        // The hands we are interested.
        var criteria = this.SimulateMap[caseName].PreCheck;
        var samples = [];
        var spread = new Set();    // Every criteria get a fair share.
        var beginTime = new Date();
        var hasPostFilter = 'PostFilter' in this.SimulateMap[caseName] && this.SimulateMap[caseName].PostFilter != null;
        var timerCount = 1;
        var loopCount = 0;
        var sid = setInterval(() => {
            let intStart = new Date();
            let oneLoop = 0
            while (oneLoop < this.TIMER && samples.length < this.sampleSize) {
                this.board.deal();
                this.totalDealt++;
                let found = false;
                for (let c = 0; c < criteria.length && !found; ++c) {
                    if (!hasPostFilter && spread.has(c))
                        continue;
                    for (let seat = 0; seat < 4 && !found; ++seat) {
                        found = this.matchCriteria(this.board.seats[seat], null, criteria[c]) &&
                            (!hasPostFilter || !this.SimulateMap[caseName].PostFilter(this.board, seat));
                        if (found) {
                            let annotation = null;
                            if ('Meta' in criteria[c] && 'Annotation' in criteria[c].Meta)
                                annotation = this.seqString(criteria[c].Meta.Annotation);
                            let sIdx = this.pushSample(samples, seat, pushPartner, annotation);
                            this.showOneSample(e, samples, sIdx);
                            if (!hasPostFilter) {
                                spread.add(c);
                                if (spread.size == criteria.length)
                                    spread.clear();
                            }
                        }
                    }
                }
                oneLoop = new Date() - intStart;
                ++loopCount;
            }
            if (samples.length >= this.sampleSize)
                this.simFinalize(e, sid, samples, beginTime, loopCount/timerCount);
            else
                ++timerCount;
        }, this.TIMER);
    }
}

// Click handlers
function Simulate(e) { simModule.action(simModule.SimulateMap); }
