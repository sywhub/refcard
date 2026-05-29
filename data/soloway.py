#!/usr/bin/env python3
# Soloway Jump Shift
# From https://kwbridge.com/js.htm
# Alternative is at BridgeBum

class Soloway:
    def __init__(self):
        self.meta = "'Meta': {'Convention': 'Soloway Jump Shift'}"
        self.suits = ['S', 'H', 'D', 'C']
        return
    
    def genRules(self):
        print("// Soloway Jump Shift")
        print("BidComponents.push({'Flag': 'Soloway', 'Name': 'Soloway Jump Shift', 'Rules': [") 
        # Opening and 1st SJS bid
        for s in self.suits:
            print("{'Bids': [")
            jTargets = [x for x in self.suits if x != s]
            for js in jTargets:
                l = 3 if (self.suits.index(s) < self.suits.index(js)) else 2
                print(f"\t{{'Bid': '{l}{js}', 'Criteria': [")
                self.sjsCriteria(s, js)
                print(']}',end='')
                if jTargets.index(js) != 2:
                    print(',')
            print(f"],\n\t'Seq': ['1{s}', '-']}},")
        self.rebid()
        self.sjsrebid()
        print(']});')
    
    # Soloway JS could be one of the 4 cases
    def sjsCriteria(self, s, js):
        cStrings = []
        cStrings.append(f"{{'HCP': 17, 'SuitLen': 5, 'Honors': 2, {self.meta}}}")
        cStrings.append(f"{{'HCP': [13, 16], 'SuitLen': 6, 'Honors': 3, {self.meta}}}")
        cStrings.append(f"{{'HCP': [17, 19], 'SuitLen': 5, 'Shape': 'Balanced', {self.meta}}}")
        cStrings.append(f"{{'HCP': 16, 'SuitLen': {{'{js}': 5, {s}: 4}}, 'Honors': 2, {self.meta}}}")
        for str in cStrings:
            print(f"\t\t{str}", end='')
            if cStrings.index(str) != 3:
                print(',')

    def rebid(self):
        print('\n// Opener rebids')
        for s in self.suits:
            jTargets = [x for x in self.suits if x != s]
            for js in jTargets:
                rebids = self.makeRebids(s, js)
                print("{'Bids': [")
                for r in rebids:
                    if r[1:] == js:
                        print(f"\t{{'Bid': '{r}', 'Criteria': [{{'SuitLen': 3, 'Honors': 1, {self.meta}}}]}},")
                    elif r[1:] == s:
                        print(f"\t{{'Bid': '{r}', 'Criteria': [{{'SuitLen': 5, {self.meta}}}]}},")
                    else:
                        print(f"\t{{'Bid': '{r}', 'Criteria': [{{'Stopper': '{r[1:]}', {self.meta}}}]}},")
                stoppers = [x for x in self.suits if x != js and x != s]
                l = 3 if (self.suits.index(s) < self.suits.index(js)) else 2
                print(f"\t{{'Bid': '{l}NT', 'Criteria': [{{'Stopper': {stoppers}, 'Shape': 'Balanced', {self.meta}}}]}}],")
                print(f"\t'Seq': ['1{s}', '-', '{l}{js}', '-']}},")

    def makeRebids(self, s, js):
        rebids = []
        l = 3 if (self.suits.index(s) < self.suits.index(js)) else 2
        rebids.append(f"{l+1}{js}")
        b = f"{l + (0 if self.suits.index(s) < self.suits.index(js) else 1)}{s}"
        rebids.append(b)
        jTargets = [x for x in self.suits if x != s]
        newSuits = [y for y in jTargets if y != js]
        for ns in newSuits:
            nsLevel = l + (0 if self.suits.index(ns) < self.suits.index(js) else 1)
            rebids.append(f'{nsLevel}{ns}')
        return rebids

    def sjsrebid(self):
        print('\n// SJS rebids')
        for s in self.suits:
            jTargets = [x for x in self.suits if x != s]
            for js in jTargets:
                print(f'\n// {s} - {js}')
                l = 3 if (self.suits.index(s) < self.suits.index(js)) else 2
                rebids = self.makeRebids(s, js)
                rebids.append(f'{l}NT')
                for rebid in rebids:
                    print("{'Bids': [")
                    rLevel = int(rebid[0])
                    rSuit = rebid[1:]
                    newSuits = [x for x in self.suits if x not in [s, js, rSuit]]
                    newSuits = [f"{rLevel if rSuit != 'NT' and self.suits.index(x) < self.suits.index(rSuit) else rLevel+1}{x}" for x in newSuits]
                    newSuits = [x for x in newSuits if int(x[0]) <= 4]
                    jsLevel = rLevel + (1 if rSuit == 'NT' or self.suits.index(js) > self.suits.index(rSuit) else 0)
                    if js != rSuit and jsLevel <= 3:
                        print(f"\t{{'Bid': '{jsLevel}{js}', 'Criteria': [{{'HCP': 17, 'SuitLen': 5, 'Honors': 2, {self.meta}}}]}},")
                    if js != rSuit and jsLevel == 4:
                        print(f"\t{{'Bid': '{jsLevel}{js}', 'Criteria': [{{'HCP': [13,16], 'SuitLen': 6, 'Honors': 3, {self.meta}}}]}},")
                    if rSuit != 'NT' and rLevel == 2:
                        print(f"\t{{'Bid': '{rLevel}NT', 'Criteria': [{{'HCP': [17,19], 'Shape': 'Balanced', {self.meta}}}]}},")
                    for ns in newSuits: 
                        print(f"\t{{'Bid': '{ns}', 'Criteria': [{{'HCP': 16, 'SuitLen': {{'{js}': 5, '{s}': 4, '{ns[1:]}': [0, 1]}}, {self.meta}}}]}},")
                    if rSuit != 'NT' and rLevel <= 3:
                        print(f"\t{{'Bid': '{rLevel}NT', 'Criteria': [{{'HCP': 16, 'SuitLen': {{'{js}': 5}}, 'Shape': 'Balanced', {self.meta}}}]}},")
                    elif rSuit == 'NT' and rLevel < 3:
                        print(f"\t{{'Bid': '3NT', 'Criteria': [{{'HCP': 16, 'SuitLen': {{'{js}': 5}}, 'Shape': 'Balanced', {self.meta}}}]}},")
                    jsLevel = rLevel + (1 if rSuit == 'NT' or self.suits.index(s) >= self.suits.index(rSuit) else 0)
                    print(f"\t{{'Bid': '{jsLevel}{s}', 'Criteria': [{{'HCP': 16, 'SuitLen': {{'{js}': 5, '{s}': 4}}, 'Shape': 'Semi-Balanced', {self.meta}}}]}}],")
                    print(f"\t'Seq': ['1{s}', '-', '{l}{js}', '-', '{rebid}', '-']}},")

if __name__ == '__main__':
    soloway = Soloway()
    soloway.genRules()
