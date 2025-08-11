/*
 * Bridge board and 4 hands
 * Sin-Yaw Wang, 2024
 * 
 * Deal 4 hands into a board.  Evaluate each hand.
 */
class Hand {
    // shallow copy the cards
    // sort them in Bridge style
    // initialize all strength properties
    constructor(h) {
        this.hand = [...h]; // shallow copy
        this.sorthand();
        this.HCP = 0;
        this.TP = 0;
        this.DP = 0;
        this.LTC = 0;
        this.Suits = [0, 0, 0, 0];
        this.Honors = [0, 0, 0, 0];
        this.have54 = false;
        this.have55 = false;
        this.Balanced = false;
    }

    // Decending order, in Bridge sense
    sorthand() {
        this.hand.sort((a, b) => {
            if (a.suit != b.suit)
                return b.suit - a.suit;
            return b.rank - a.rank;});
    }

    // convert a hand to printable form
    toString() { return this.basicString(); }

    // all the cards, displayed by suit and ranking order
    // as pre-sorted
    basicString() {
        let suit = this.hand[0].suit;
        var str = Card.cHTML[suit];
        for (let j of this.hand) {
            if (j.suit != suit) {
                suit = j.suit;
                str += " " + Card.cHTML[suit];
            }
            if (j.rank < Card.Jack)
                str += j.rank + 2;
            else
                str += Card.Royals[j.rank - Card.Jack];
        }
        return str;
    }

    // Hand's evaluted results
    valuation() {
        let str = trEnZh("Cards")+": "
        for (let j = Card.Spade(); j >= Card.Club(); j--)
            str += this.Suits[j - 1] + " ";
        str += ", "+trEnZh("Honors")+": "
        for (let j = Card.Spade(); j >= Card.Club(); j--)
            str += this.Honors[j - 1] + " ";
        str += ", HCP: " + this.HCP;
        str += ", DP: " + this.DP;
        str += ", LTC: " + this.LTC;
        if (this.Balanced)
            str += ", "+trEnZh("Balanced");
        else if (this.have55)
            str += ", "+trEnZh("5-5 suits");
        else if (this.have54)
            str += ", "+trEnZh("5-4 suits");

        return str;
    }

    eval() {
        this.countHonors();
        this.countSuits();
        this.countStrength();    // in the sequence of HCP, DP, TP
        this.isBalanced();
        this.twoSuiter();
    }

	// length of each suit in a hand
	countSuits() {
        this.hand.forEach(x => { this.Suits[x.suit - 1] += 1; });
	}

    countStrength() {
        this.countHCP();
        this.countDP();
        this.countTP();
        this.countLTC();
    }

	countHCP() {
        this.hand.forEach(x => {
			if (x.rank >= Card.Jack)
				this.HCP += x.rank - Card.Jack + 1;
		});
    }

	countHonors() {
        this.hand.forEach(x => {
			if (x.rank > Card.Jack)
                this.Honors[x.suit - 1] += 1; });
	}

	// add only long-suit distribution points
	countTP() {
		this.TP = this.HCP + this.DP;;
	}

	countDP() {
		this.DP = 0;
		this.Suits.forEach(x => {if (x >= 5) this.DP += (x - 4);});
		this.Suits.forEach(x => {
			if (x == 0)
				this.DP += 5;
			else if (x == 1)
				this.DP += 3;
			else if (x == 2)
				this.DP += 1;
		});
	}

    countLTC() {
        const Ace = 12;
        const King = 11;
        const Queen = 10;
        for (let s = Card.Spade(); s >= Card.Club(); s--) {
            let scards = this.hand.filter(x => x.suit == s).map(y => y.rank);
            let loser = 3;

            if (scards.length < 3)
                loser = scards.length;

            if (scards.includes(Card.Ace))
                loser -= 1;
            if (scards.includes(Card.King) && scards.length >= 2)
                loser -= 1;
            if (scards.includes(Card.Queen)) {
                if (scards.length >= 3) {
                    // Qxx = 2
                    // AQx = 1.5, previous case already took care of Ace
                    // KQx = 1
                    // AKQ = 0
                    loser--;
                    if (loser > 0 && scards.includes(Card.Ace))
                        loser -= 0.5;
                } else if (scards.length >= 2) {
                    // Qx = 2
                    // AQ = 0.5
                    // KQ = 1, previous case took care of K
                    if (scards.includes(Card.Ace))
                        loser -= 0.5;
                }
			}
            this.LTC += loser;
        }
    }

	isBalanced() {
		let deuce = 0;
        this.Balanced = true;
        this.Suits.forEach(x => {
            if (x <= 1)
                this.Balanced = false;
            else if (x == 2)
                deuce++;
        });
        if (this.Balanced && deuce >= 2)
            this.Balanced = false;
	}

    twoSuiter() {
        var count54 = 0;
        this.have55 = false;
        this.have54 = false;
        this.Suits.forEach(x => {if (x >= 5) count54 += 1;});
        if (count54 >= 2)
            this.have55 = true;
        else if (count54 == 1)
            this.Suits.forEach(x => {if (x == 4) count54 += 1;});
        this.have54 = count54 >= 2;
    }
}

// A board is 4 hands of 13 cards each
class Board {
    constructor(deck) { this.deck = deck; this.seats = []; this.deal(); }

    deal() {
        this.deck.shuffle();
        this.dealSeats();
    }
    load(deckcards) {
        this.deck.loadcards(deckcards);
        this.dealSeats();
    }
    
    dealSeats() {
        for (let i = 0; i < 4; i++) {
            let seatCards = [];
            for (let j = 0; j < 13; j++)
                seatCards.push(this.deck.cards[i*13+j]);
            this.seats[i] = new Hand(seatCards);
            this.seats[i].eval();
        }
    }

    toString() {
        var str = "Board:<br>";
        for (let i = 0; i < b.seats.length; i++) 
            str += (i+1) + ': ' + b.seats[i].toString() + '<br>';
        str += '<br>';
        return str;
    }
}

function BoardUnitTest(dname) {
    const LOOP = 10;
    var d = new Deck();
    var b = new Board(d);
    var container = document.getElementById(dname);
    clearContents(container);
    var e = document.createElement('div');
    container.appendChild(e);
    e.setAttribute('class', 'BoardLayout');

    var NShuffle = 1;
    for (let j = 0, row = 1; j < LOOP; j++, row++) {
        b.deal();
        gridElement(e, 'Shuffle '+(NShuffle++)+': ', 1, row++);
        let n = 0;
        const Dir = ['N', 'E', 'S', 'W']
        for (let i of b.seats) {
            gridElement(e, Dir[n] +  ": " + i.basicString(), 1, row);
            gridElement(e, i.valuation(), 2, row);
            n++;
            row++;
        }
    }
}
