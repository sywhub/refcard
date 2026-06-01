class BidSystem {
    constructor() {
        this.totalDealt = 0;
    }

    resetCounter() { this.totalDealt = 0; }
    roundSeat(n) { return n % 4; }

    // Turn bid sequence into pretty string
    seqString(sequence) { 
        var seqStr = "";
        var opponent = sequence.length % 2;
        for (const s of sequence) {
            let str = this.htmlBid(s);
            if (opponent == 1) {
                if (str != '-')
                    str = '[' + str + ']';
                seqStr += '<span class="OpponentBid"> ' + str + '</span>';
            } else
                seqStr += ' ' + str;
            opponent = 1 - opponent;
        }       
        return seqStr;
    } 


    /* 
     * SuitLen syntax is probably too complicated
     * For now:
     * SuitLen: <simple descriptor> | SuitChar <simple descriptor> | object
     * simple descriptor = num | array of 2 numbers
     * SuitChar: one of S, H, D, C
     * num = lower limit (inclusive)
     * array of 2 numbers = [lower, higher) // thinking of retiring this
     * object = Suit : <simple descriptor> [, object]
     */
    suitLenString(k, v, bid) {
        var retString = "";
        if (Array.isArray(v)) {
            if (v[0] == 0)
                retString += v[1] + '-';
            else if (Number(v[0]) == Number(v[1]))
                retString += v[0];
            else
                retString += v[0] + '~' + v[1];
            retString += Card.ltr2html(bid.slice(1));
        } else if (typeof(v) == 'object') {
            for (const [sKey, sVal] of Object.entries(v)) {
                if (Array.isArray(sVal)) {
                    if (sVal[0] == 0)
                        retString += sVal[1] + '-';
                    else if (Number(sVal[0]) == Number(sVal[1]))
                        retString += sVal[0];
                    else
                        retString += sVal[0] + '~' + sVal[1];
                } else
                    retString += sVal + '+';
                retString += Card.ltr2html(sKey);
                retString += ' and ';
            }
            retString = retString.slice(0, -5);
        } else {
            retString += v + '+' + Card.ltr2html(bid.slice(1));
        }

                
        return retString;
    }

    // Turn bid into pretty HTML code
    htmlBid(txtBid) {
        if (txtBid == "X" || txtBid == "XX" || txtBid == '-')
            return txtBid;
        return txtBid[0]+Card.ltr2html(txtBid.slice(1));
    }

    /*
     * AnySuit is an object of [SuitChar Num] pairs
     */
    anySuitString(k, v, dummy) {
        var str = trEnZh("Any of");
        for (const [sKey, sVal] of Object.entries(v)) 
            str += `  ${sVal}+${Card.ltr2html(sKey)} `;
        return str.trim();
    }

    honorsString(k, v, bid) {
        var s = this.suitLenString(k, v, bid);
        return s + ' Honors';
    }

    criteriaString(c, bid) {
        if (c === undefined || c == null || c.length <= 0)
            return '';

        var dispatchTbl = {
            'SuitLen': this.suitLenString,
            'AnySuit': this.anySuitString,
            'Honors': this.honorsString,
        }
        var retString = "";
        var tmpString = "";
        var comma = false;
        for (const [k, v] of Object.entries(c)) {
            if (k in dispatchTbl) {
                if (comma) {retString += ", "}
                comma = true;
                retString += dispatchTbl[k].bind(this, k, v, bid)();
            } else {
                if (comma) {retString += ", "}
                comma = true;
                switch (k) {
                case 'HCP':
                case 'LTC':
                case 'TP':
                    if (Array.isArray(v)) {
                        if (v[0] == 0)
                            retString += v[1]+'- '+trEnZh(k);
                        else if (v[0] == v[1])
                            retString += v[0]+' '+trEnZh(k);
                        else
                            retString += v[0]+'~'+v[1]+' '+trEnZh(k);
                    } else
                        retString += v+'+'+trEnZh(k);
                    break;
                case 'Seat':
                    retString += trEnZh("At " + v[0] + ' or ' + v[1] + ' Seat');
                    break;
                case 'Shape':
                    if (v == "Balanced" || v == "Semi-Balanced")
                        retString += " " + trEnZh(v);
                    else
                        retString += " " + trEnZh(v + " or better");
                    break;
                case 'SingleVoid':
                    retString += trEnZh("Singleton or Void");
                    break;
                case 'Control':
                    if (typeof(v) == 'string')
                        retString += Card.ltr2html(v) + ' '+trEnZh('have ' + k);
                    else if (typeof(v) == 'boolean')
                        retString += trEnZh(k);
                    break;
                case 'KingSuit':
                    retString += trEnZh("Have")+" " + Card.ltr2html(v) + "K" ;
                    break;
                case 'NoStopper':
                case 'Stopper':
                    if (Array.isArray(v)) {
                    for (let i = 0; i < v.length - 1; ++i)
                        retString+=Card.ltr2html(v[i])+' and ';
                    retString+=Card.ltr2html(v[v.length -1]);
                    } else
                    retString += Card.ltr2html(v);
                    if (k == 'Stopper')
                        retString+= " "+trEnZh("Stopper");
                    else if (k == 'NoStopper')
                        retString += " " + trEnZh("No Stopper");
                    break;
                case 'TrumpQ':
                    tmpString = "";
                    if (v)
                        tmpString = 'Have';
                    else
                        tmpString = 'No';
                    retString += trEnZh(tmpString + " "+ "Trump Queen");
                    break;
                case 'KeyCard':
                case 'AceCount':
                case 'KingCount':
                    tmpString = "";
                    if (Array.isArray(v))
                        tmpString = "Have"+" " + v[0] + ' or ' + v[1];
                    else
                        tmpString = "Have"+" " + v;
                    if (k == 'AceCount' || k == 'KingCount')
                        tmpString += ' ' + k.slice(0,-5);
                    else
                        tmpString += ' ' + k;
                    retString += trEnZh(tmpString);
                    break;
                case 'SideKing':
                    retString += v ? (Card.ltr2html(bid.slice(1))+' '+trEnZh('Side King')) : trEnZh('No Side King');
                    break;
                case 'Meta':
                    comma = false;
                    break;
                default:
                    retString += '"' + k + '": "' + v + '"';
                    break;
                }
            }
        }
        retString = retString.trim();
        if (retString.at(-1) == ',')
            retString=retString.substring(0,retString.length-1);
        return retString;
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
                        met = hand.Suits.filter(s => s < 2).length == 0 && hand.Suits.filter(s => s == 2).length < 2;
                    else if (v == 'Semi-Balanced')
                        met = hand.Suits.filter(s => s < 2).length == 0;
                    break;
                case 'SingleVoid':
                    v = [0, 1];
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

    // Find a board that matches the bid sequence given, and the options of the following bids
    findSeqMatch(seq) {
        var NSHUFFLES = 500;
        var found = null
        do {
            found = this.seqMatchOnce(seq);
            NSHUFFLES -= this.totalDealt;
        } while (found == null && NSHUFFLES > 0);
        return found;
    }


    // Faciliate looping above.
    seqMatchOnce(seq) {
        const NSHUFFULS = 100;
        var open = null, matches;
        var ret = null;
        // First try NSHUFFLES times to find a match for the opening bid,
        // then if found try to find matches for the subsequent bids without shuffling
        // Last see if the next seat meet the final criteria.
        for (let i = 0; i < NSHUFFULS && open == null; i++)  {
            this.board.deal();
            this.totalDealt++;
            let j = 0;
            while (open == null && j < 4) 
                [open, matches] = this.matchSeat(seq[0], Config.WorkingSet.Rules[seqKey('Open')], j++);
        }
        if (open == null)
            return ret;
        var subseqBid = null
        for (let k = 0; k < seq.length-1; k++) {
            let nextSeat = this.roundSeat(open+k+1);
            [subseqBid, matches] = this.matchSeat(seq[k+1], Config.WorkingSet.Rules[seqKey(seq.slice(0,k+1))], nextSeat, k);
            if (subseqBid == null)
                return ret;
        }
        ret = open;
        return ret;
    }

    matchSeat(expect, rules, seat, seqIndex = 0) {
        let matches = [];
        let chosen = [];
        if (rules == null && expect == '-')
            return [seat, matches];

        for (const b of rules.Bids) 
            for (const c of b.Criteria) 
                if (matches.filter(x => x[0] === b.Bid).length == 0 && this.matchCriteria(this.board.seats[seat], b.Bid, c))
                    matches.push([b.Bid, c])
        if (matches.length > 1)
            chosen = this.bestBid(this.board.seats[seat], matches, seqIndex);
        if ((expect == '-' && chosen.length == 0) || chosen.includes(expect))
            return [seat, chosen];
        return [null, null];   
    }

    /*
     * Choose one among bids that matched some criteria.
     */
    bestBid(hand, matches, seqIndex) {
        return matches.map(x => x[0]);

        // First should be major trump suit match.
        // local function
        let filterKey = (k, arr) => {
            let subset = arr.filter(x => k in x);
            subset.sort((a, b) => {
                if (typeof(a[k]) == 'object' && typeof(b[k]) == 'object') { 
                    let aVal = Object.values(a[k])[0], bVal = Object.values(b[k])[0];
                    return bVal - aVal;
                }
                return b[k] - a[k];
            });
            return subset.filter(x => {
                if (typeof(x[k]) == 'object') 
                    return Object.values(x[k])[0] >= Object.values(subset[0][k])[0];
                return x[k] >= subset[0][k];
            });
        };
        var subMatches = [];
        var o = null
        // extract Strength and SuitLen info for each bid, if any
        matches.forEach(x => {
            o = {'Bid': x[0]};
            if ('HCP' in x[1])
                o['Strength'] = Array.isArray(x[1].HCP) ? x[1].HCP[0] : x[1].HCP;
            else if ('TP' in x[1])
                o['Strength'] = Array.isArray(x[1].TP) ? x[1].TP[0] : x[1].TP;
            if ('SuitLen' in x[1]) {
                let bidSuit = x[0].slice(-1);
                let sl = x[1].SuitLen;
                o['Length'] = {}
                if (Array.isArray(sl)) {
                    if (sl[0] != 0)
                        o['Length'][bidSuit] = sl[0];
                } else if (typeof(sl) == 'object') {
                    for (const [sKey, sVal] of Object.entries(sl)) {
                        if (Array.isArray(sVal)) {
                            if (sl[0] != 0)
                                o['Length'][sKey] = sVal[0];
                        } else 
                            o['Length'][sKey] = sVal
                    }
                 } else {
                    o['Length'][bidSuit] = sl;
                }
            }
            subMatches.push(o);
        });
        /*
         * 1. Pick the bid that has the highest strength requirement, if only one.
         * 2. Otherwise, there must be multiple bids with the same strength requirement.
         *    We pick the one with the longest suit requirement, if only one.
         * 3. Next, there must be multiple bids with the same strength and length requirement.
         *    We pick the one that the hand has the longest suit, if only one.
         * 4. Finally, the hand has two equally long suits.  We pick the higher one if opening, otherwise the lower one.
         */
        let hasStrength = filterKey('Strength', subMatches);
        if (hasStrength.length > 0)
            return hasStrength.map(x => x[0]);  // XXX: Bugs.  Disabled for now.

        if (hasStrength.length == 1)
            return [hasStrength[0].Bid];

        // There could be 0 or more than 1 criteria with Strength.
        let hasLength = filterKey('Length', hasStrength.length > 1 ? hasStrength : subMatches);
        if (hasLength.length == 1)
            return [hasLength[0].Bid];
        
        // Assumed that there was at least one with Length.
        // Then we are left with multiple bids with the same strength and length.
        if (hasLength.length > 1) {
            hasLength.forEach(x => {
                for (const s of Object.keys(x.Length)) {
                    let long = hand.Suits[Card.ltr2code(s) - Card.Club()];
                    x.Length[s] = long;
                }
            });
            hasLength = filterKey('Length', hasLength);
            if (hasLength.length == 1)
                return [hasLength[0].Bid];
            let maj = hasLength.filter(x => ['S', 'H'].includes(x.Bid.slice(-1)));
            if (maj.length == 1)
                return [maj[0].Bid];
            if (maj.length > 1) {
                maj.sort((a, b) => Card.ltr2code(b.Bid.slice(-1)) - Card.ltr2code(a.Bid.slice(-1)));
                return [maj[seqIndex <= 0 ? 0 : 1].Bid];
            }

            // should sort on SuitLen key
            hasLength.sort((a, b) => Card.ltr2code(b.Bid.slice(-1)) - Card.ltr2code(a.Bid.slice(-1)));
            return [hasLength[seqIndex <= 0 ? 0 : 1].Bid];
        }

        // Now we have an issue.
        return matches.map(x => x[0]);
    }
}
