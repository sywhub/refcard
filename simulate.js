class SimStat extends BidSystem {
    constructor(menuId) {
        super()
        this.SenarioMenu = ['1x', '1NT', '2C', 'Preempt'];
        this.SimulateMap = {'Name': 'Simulate',
            '1x': [['1S', '-'],['1H', '-'],['1D', '-'],['1C', '-']],
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
        var e = document.getElementById('SimStat');
        clearContents(e)
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

    doStats(e, s) {
        e.insertAdjacentHTML('beforeend', `Statistics: ${s}<br>`);
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
        var b = null, c = null;
        do {
            var bIdx = Math.floor(Math.random() * spread.length);
            var cIdx = Math.floor(Math.random() * spread[bIdx].CriterCount.length);
            b = bids.Bids[bIdx];
            c = b.Criteria[cIdx];
        } while (!('HCP' in c));
        e.insertAdjacentHTML('beforeend', `Seq: ${seqString}<br>&nbsp;&nbsp;Responses: `);
        e.insertAdjacentHTML('beforeend', `${this.htmlBid(b.Bid)},&nbsp;`);
        e.insertAdjacentHTML('beforeend', `with Criteria: ${this.criteriaString(c, b.Bid)}<br>`);
        e.insertAdjacentHTML('beforeend', '<br>')
    }
}

// Click handlers
function Simulate(e) { simModule.work(simModule.SimulateMap); }
function RunStat(e) { simModule.work(simModule.StatsMap); }