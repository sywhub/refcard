#!/usr/bin/env python3
"""Generate Fit Showing Jump rules for fitsj.data."""
from convention import Convention

class FitSJ(Convention):
    def __init__(self):
        super().__init__()
        self.meta['Meta']['Convention'] = 'Fit Showing Jump'
        self.tpRange = {2: 11, 3: 13, 4: 15, 5: 16}

    def oneBid(self, o, jLevel, j, js):
        if self.newBidLine:
            print('\t\t',end='')
        self.newBidLine = True
        print(f"{{'Bid': '{jLevel}{j}',",end='')
        supportLen = 4 if self.suits.index(o) <= 1 else 5
        print(f" 'Criteria': [{{'TP': {self.tpRange[jLevel]}, 'SuitLen': {{'{j}': 5, '{o}': {supportLen}}}, ",end="")
        conv = self.meta['Meta']['Convention']
        print(f"'Meta': {{'Convention': '{conv}', 'GF': true}}}}]}}",end='')
        if j != js[-1]:
            print(',')
        else:
            print('',end='')

    # A set of Fit SJ, responder jump after RHO overcalled
    def rulesResponder(self):
        for o in self.suits:
            over = [x for x in self.suits if x != o]
            over.append('X')
            for b in over:
                oLevel = 1 + self.bidLevelInc(b, o)
                self.startBids()
                js = [x for x in self.suits if x != o and x != b]
                for j in js:
                    jLevel = oLevel + 1 + self.bidLevelInc(j, b, o)
                    self.oneBid(o, jLevel, j, js)
                print("],")
                overBid = f"{oLevel if b != 'X' else ''}"
                overBid += b
                print(f"\t'Seq': ['1{o}', '{overBid}']}},")

    # Rule set B is for advancer to jump to a new suit against overcall's bid
    # The advancer is either the 4th seat or pass hand
    def rulesAdvancer(self):
        for o in self.suits:
            over = [x for x in self.suits if x != o]
            for inf in over:
                iLevel = 1 + self.bidLevelInc(inf, o)
                res = ['-', 'X', o]
                res.extend([x for x in self.suits if x != o and x != inf])
                for r in res:
                    self.startBids()
                    rLevel = iLevel + self.bidLevelInc(r, inf)
                    js = [x for x in self.suits if x != inf and x != r and x != o]
                    for j in js:
                        jLevel = rLevel + 1 + self.bidLevelInc(j, r, inf)
                        self.oneBid(inf, jLevel, j, js)
                    print("],")
                    infBid = f"{iLevel if inf != 'X' else ''}"
                    infBid += inf
                    rBid = f"{rLevel if r != 'X' and r != '-' else ''}"
                    rBid += r
                    print(f"\t'Seq': ['1{o}', '{infBid}', '{rBid}']}},")
        return

    def genRules(self):
        self.prtHeader(flag='Fit Showing Jump')
        print("  'Rules': [ ")
        self.rulesResponder()
        self.rulesAdvancer()
        print("  ]});")

if __name__ == "__main__":
    FitSJ().genRules()