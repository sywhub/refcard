/*
 * Basic playing cards in a deck
 * Sin-Yaw Wang, 2024
 */
class Card {
    /* Suits are defined as numerals in Bridge ascending order starting at 1
     * This is significant for deciding the right bidding level.
     * Ranks starts with deuce as numerical zero
     * And goes up to 12 as Ace.
     *
     * If JS support Enum!
     */
    static Codes = {'-': 0, 'C': 1, 'D': 2, 'H': 3, 'S': 4, 'NT': 5, 'X': 6, 'XX': 7};
    static cHTML = ['-', '&clubs;', '<span style="color: red">&diams;</span>', '<span style="color: red">&hearts;</span>', '&spades;',
        'NT', 'X', 'XX'];

    static Jack = 9;    // Jack is numerical 9
    static Queen = 10;
    static King = 11;
    static Ace = 12;
    static Royals=['J', 'Q', 'K', 'A'];     // High cards

    static Pass() { return Card.Codes['-'];}
    static Club() { return Card.Codes['C'];}
    static Diam() { return Card.Codes['D'];}
    static Heart() { return Card.Codes['H'];}
    static Spade() { return Card.Codes['S'];}
    static NT() { return Card.Codes['NT'];}
    static DBL() { return Card.Codes['X'];}
    static RDBL() { return Card.Codes['XX'];}
    static NoSuit() { return 0xff;}

    // return things like 1H to "3", and 2NT to "5"
    static ltr2code(l) {
        if (l == undefined)
            return Card.NoSuit();
        if (l in Card.Codes)
            return Card.Codes[l];
        if (l.length > 1 && l.slice(1) in Card.Codes)
            return Card.Codes[l.slice(1)];
        return Card.NoSuit();
    }
	static ltr2html(l) { return Card.cHTML[Card.ltr2code(l)]; }
    static code2ltr(c) {return Object.keys(Card.Codes).find(k => Card.Codes[k] == c);}
k
    // must construct within valid range
    constructor(s, r) {
        this.suit = s;
        this.rank = r;
        if (s < Card.Club() || s > Card.Spade())
            this.suit=Card.Spade();
        if (r < 0 || r > 12)
            this.rank=0;
    }
    
    // trivial conversion for ease of print
    toString() {
        let r = this.rank;
        if (r >= Card.Jack)
            r = Card.Royals[this.rank - Card.Jack];
        else
            r = this.rank + 2;
        return Card.cHTML[this.suit]+r;
    }

    static suitchars() {
        return Card.cHTML[Card.Spade()]+
        Card.cHTML[Card.Heart()]+
        Card.cHTML[Card.Diam()]+
        Card.cHTML[Card.Club()];
    }
}

/*
 * Standard deck without Jokers
 */
class Deck {
    static ncards=52;
    // initialize as a new deck
    constructor() {
        this.cards = [];
        var i = 0;
        for (let s = Card.Club(); s <= Card.Spade(); s++)
            for (let r = 0; r < 13; r++) {
                this.cards[i] = new Card(s, r);
                i++;
            }
    }

    loadcards(predealts) {
        if (predealts.length != Deck.ncards)
            return;

        this.cards = [];
        predealts.forEach(c => this.cards.push(c));
    }

    // Fisher-Yates 5 times
    shuffle() {
        for (let j = 0; j < 5; j++) {
            for (let i = Deck.ncards - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                // swap
                [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
            }
        }
    }

    dump(e) {
        let k = 0;
        for (let j = Card.Club(); j <= Card.Spade(); j++) {
            let s = "";
            for (let i = 0; i < 13; i++)
                s += this.cards[k++].toString();
            e.insertAdjacentHTML('beforeend', s+'<br>');
        }
    }

}


function CardUnitTest(containername) {
    var d = new Deck;
    var e = document.getElementById(containername);
    clearContents(e);
    var disp = document.createElement('div')
    e.appendChild(disp)
    disp.insertAdjacentHTML('beforeend', '<br><span class="Zero">New Deck</span><br>');
    var row = d.dump(disp);
    d.shuffle();
    disp.insertAdjacentHTML('beforeend', '<br><span class="Zero">Shuffled</span><br>');
    d.dump(disp);
}