/* Common code for simulator and statistics. */
class SimStats extends BidSystem {
    // Make a sub div element for displaying the results.  This is to allow us to clear the results without affecting the menu.
    constructor() {
        super();
    }

    initDisplay() {
        var e = document.getElementById('ListDisplay');
        this.disp = document.createElement('div');
        this.disp.setAttribute('id', 'SimStat');
        this.disp.setAttribute('class', 'SimStat');
        e.appendChild(this.disp);
    }

    // From constructor, make selection menu
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

    pushSample(samples, seat, handChoice, annotation) {
        let sObj = {'Hands': [], 'Annotation': annotation};
        let inc = 1;
        if (handChoice == 2) 
            inc = 2;
        else if (handChoice == 0)
            inc = 4;
        for (let i = 0; i < 4; i +=inc) {
            let sIdx = this.roundSeat(seat+i);
            sObj.Hands.push(JSON.parse(JSON.stringify(this.board.seats[sIdx].hand)));
        }
        samples.push(sObj);
        return samples.length;
    }

    // Display the samples
    // Samples all assumes the 1st seat to open, 3rd being its partner.
    showSamples(e, samples, description, seq=null) {
        // First display on the screen.
        // Then generate the LIN lines for BBO.
        let row = 1;
        let bIdx = 1;
        e.insertAdjacentHTML('beforeend', `<h2>${description}</h2>`);
        let sampleDiv = document.getElementById('SamplesContents');
        if (sampleDiv == null) { 
            sampleDiv =document.createElement('div');
            sampleDiv.setAttribute('id', 'SamplesContents');
            e.appendChild(sampleDiv);
        }
        if (samples[0].Annotation != null)
            sampleDiv.setAttribute('style', `display: grid; grid-template-columns: 2vw 6vw repeat(4, 15vw); gap: 1vw;`);
        else
            sampleDiv.setAttribute('style', `display: grid; grid-template-columns: 2vw repeat(4, 15vw); gap: 1vw;`);
        for (const s of samples) {
            // Show only North and South
            sampleDiv.insertAdjacentHTML('beforeend', `<div class="Counter" style="grid-column: 1; grid-row: ${row};">${bIdx++}.</div>`);
            let sNext = [0];
            if (s.Hands.length > 2) 
                sNext.push(2);
            else if (s.Hands.length > 1) 
                sNext.push(1);
            let colIdx = 2;
            if (s.Annotation != null)
                sampleDiv.insertAdjacentHTML('beforeend', `<div class="Annotation" style="grid-column: ${colIdx++}; grid-row: ${row};">${s.Annotation}&nbsp;?</div>`);
            for (const sIdx of sNext) {
                let hObj = new Hand(s.Hands[sIdx]);
                let hStr = hObj.toString();
                sampleDiv.insertAdjacentHTML('beforeend', `<div class="Hand" style="grid-column: ${colIdx++}; grid-row: ${row};">${hStr}</div>`);
            }
            ++row;
        }
        this.showBBOLin(e, samples);
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
    showBBOLin(e, samples) {
        if (samples.length < 0 || samples[0].Hands.length < 4)
            return;

        let linDiv = document.createElement('div');
        e.appendChild(linDiv);
        linDiv.insertAdjacentHTML('beforeend', '<h3>BBO LIN:</h3>');
        let bIdx = 0;
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
                let hObj = new Hand(s.Hands[(hIdx+i)%4]);
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

    showOneSample(e, samples, idx) {
        let sampleDiv = document.getElementById('SamplesContents');
        if (samples[0].Annotation != null)
            sampleDiv.setAttribute('style', `display: grid; grid-template-columns: 2vw 10vw repeat(4, 15vw); gap: 1vw;`);
        else
            sampleDiv.setAttribute('style', `display: grid; grid-template-columns: 2vw repeat(4, 15vw); gap: 1vw;`);
        sampleDiv.insertAdjacentHTML('beforeend', `<div class="Counter" style="grid-column: 1; grid-row: ${idx};">${idx}.</div>`);
        let s = samples[idx-1];
        let sNext = [0];
        if (s.Hands.length > 2) 
            sNext.push(2);
        else if (s.Hands.length > 1) 
            sNext.push(1);
        let colIdx = 2;
        if (s.Annotation != null)
            sampleDiv.insertAdjacentHTML('beforeend', `<div class="Annotation" style="grid-column: ${colIdx++}; grid-row: ${idx};">${s.Annotation}&nbsp;?</div>`);
        for (const sIdx of sNext) {
            let hObj = new Hand(s.Hands[sIdx]);
            let hStr = hObj.toString();
            sampleDiv.insertAdjacentHTML('beforeend', `<div class="Hand" style="grid-column: ${colIdx++}; grid-row: ${idx};">${hStr}</div>`);
        }
    }
}