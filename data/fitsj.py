#!/usr/bin/env python3
"""Generate Fit Showing Jump rules for fsj.data."""
from convention import Convention

class FitSJ(Convention):
    def __init__(self):
        super().__init__()
        self.meta['Meta']['Convention'] = 'Fit Showing Jump'

    # A set of Fit SJ, responder jump after RHO overcalled
    def rulesA(self):
        for o in self.suits:
            over = [x for x in self.suits if x != o]
            over.append('X')
            for b in over:
                oLevel = 1 if (b == 'X') or (self.suits.index(b) < self.suits.index(o)) else 2
                print("\t{'Bids': [")
                js = [x for x in self.suits if x != o and x != b]
                for j in js:
                    if b == 'X':
                        jLevel = 1 if (self.suits.index(j) < self.suits.index(o)) else 2
                    else:
                        jLevel = 1 if (self.suits.index(j) < self.suits.index(b)) else 2
                    jLevel += oLevel
                    print(f"\t\t{{'Bid': '{jLevel}{j}',",end='')
                    supportLen = 4 if self.suits.index(o) <= 1 else 5
                    tp = 12 if jLevel <= 3 else 13
                    print(f" 'Criteria': [{{'TP': {tp}, 'SuitLen': {{'{j}': 5, '{o}': {supportLen}}}, ",end="")
                    conv = self.meta['Meta']['Convention']
                    print(f"'Meta': {{'Convention': '{conv}', 'GF': true}}}}]}},")
                print("\t\t],")
                overBid = f"{oLevel if b != 'X' else ''}"
                overBid += b
                print(f"\t'Seq': ['1{o}', '{overBid}']}},")

    def rulesB(self):
        for o in self.suits:
            over = [x for x in self.suits if x != o]
            for inf in over:
                iLevel = 1 if self.suits.index(inf) < self.suits.index(o) else 2
                res = ['-', 'X', f"'2{o}'"]
                for r in res:
                    print("\t{'Bids': [")
                    rLevel = 2 if r[0] == '2' else 1
                    js = [x for x in self.suits if x != o and x != inf]
                    for j in js:
                        if r == 'X' or r == '-':
                            jLevel = 1 if (self.suits.index(j) < self.suits.index(inf)) else 2
                        else:
                            jLevel = 2
                        jLevel += iLevel
                        print(f"\t\t{{'Bid': '{jLevel}{j}',",end='')
                        supportLen = 4 if self.suits.index(o) <= 1 else 5
                        tp = 10 if jLevel <= 3 else 12
                        print(f" 'Criteria': [{{'TP': {tp}, 'SuitLen': {{'{j}': 5, '{inf}': {supportLen}}}, ",end="")
                        conv = self.meta['Meta']['Convention']
                        print(f"'Meta': {{'Convention': '{conv}', 'GF': true}}}}]}},")
                    print("\t\t],")
                    infBid = f"{iLevel if inf != 'X' else ''}"
                    infBid += inf
                    print(f"\t'Seq': ['1{o}', '{infBid}', {r}]}},")

        return

    def genRules(self):
        self.prtHeader(flag='Fit Showing Jump')
        print("  'Rules': [ ")
        self.rulesA()
        self.rulesB()
        print("  ]});")

if __name__ == "__main__":
    FitSJ().genRules()