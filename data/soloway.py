#!/usr/bin/env python3
# Soloway Jump Shift
# From https://kwbridge.com/js.htm
# Alternative is at BridgeBum
import copy

class Soloway:
    def __init__(self):
        self.meta = {'Meta': {'Convention': 'Soloway Jump Shift'}}
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
        print(']});\n')
    
    # Soloway JS could be one of the 4 cases
    def sjsCriteria(self, s, js):
        self.replyCriteria = []
        self.replyCriteria.append({'HCP': 17, 'SuitLen': 5, 'Honors': 2} | self.meta)
        self.replyCriteria.append({'HCP': [17, 19], 'SuitLen': 5, 'Shape': 'Balanced'} | self.meta)
        self.replyCriteria.append({'HCP': [13, 16], 'SuitLen': 6, 'Honors': 3} | self.meta)
        self.replyCriteria.append({'HCP': 16, 'SuitLen': {f'{js}': 5, f'{s}': 4}, 'Honors': 2} | self.meta)
        c = len(self.replyCriteria)
        for str in self.replyCriteria:
            print(f"\t\t{str}", end='')
            c -= 1
            if c > 0:
                print(',')

    # Opener rebid
    def rebid(self):
        print('\n// Opener rebids')
        for s in self.suits:
            jTargets = [x for x in self.suits if x != s]
            for js in jTargets:
                l = 3 if (self.suits.index(s) < self.suits.index(js)) else 2
                rebids = self.makeRebids(s, js) # given the sjs response, the actual rebid options
                lastCount = len(rebids.keys())
                print("{'Bids': [")
                for r,c in rebids.items():
                    o = {'Bid': r} | c
                    print(f"\t{o}", end='')
                    lastCount -= 1
                    if lastCount > 0:
                        print(",")
                    else:
                        print('],')
                print(f"\t'Seq': ['1{s}', '-', '{l}{js}', '-']}},")

    # Opener's rebid options
    # 4 cases: raise partner, rebid self, new suit, or NT
    def makeRebids(self, s, js):
        rebids = {}
        l = 3 if (self.suits.index(s) < self.suits.index(js)) else 2
        rebids[f"{l+1}{js}"] = {'Criteria': [{'SuitLen': 3, 'Honors': 1} | self.meta]}
        b = f"{l + (0 if self.suits.index(s) < self.suits.index(js) else 1)}{s}"
        rebids[b] = {'Criteria': [{'SuitLen': 5} | self.meta]}
        jTargets = [x for x in self.suits if x != s]
        newSuits = [y for y in jTargets if y != js]
        for ns in newSuits:
            nsLevel = l + (0 if self.suits.index(ns) < self.suits.index(js) else 1)
            rebids[f'{nsLevel}{ns}'] = {'Criteria': [{'Stopper': ns} | self.meta]}
        l = 3 if (self.suits.index(s) < self.suits.index(js)) else 2
        rebids[f'{l}NT'] = {'Criteria': [{'Stopper': [x for x in self.suits if x != js and x != s], 'Shape': 'Balanced'} | self.meta]}
        return rebids

    def sjsrebid(self):
        print('\n// SJS rebids')
        for s in self.suits:
            jTargets = [x for x in self.suits if x != s]
            for js in jTargets:
                print(f'\n// {s} - {js}')
                l = 3 if (self.suits.index(s) < self.suits.index(js)) else 2
                rebids = self.makeRebids(s, js)
                for rebid in rebids.keys():
                    print("{'Bids': [")
                    rLevel = int(rebid[0])
                    rSuit = rebid[1:]
                    newSuits = [x for x in self.suits if x not in [s, js, rSuit]]
                    newSuits = [f"{rLevel if rSuit != 'NT' and self.suits.index(x) < self.suits.index(rSuit) else rLevel+1}{x}" for x in newSuits]
                    newSuits = [x for x in newSuits if int(x[0]) <= 4]
                    jsLevel = rLevel + (1 if rSuit == 'NT' or self.suits.index(js) > self.suits.index(rSuit) else 0)
                    if js != rSuit and jsLevel <= 3:
                        print(f"\t{{'Bid': '{jsLevel}{js}', 'Criteria': [{self.replyCriteria[0]}]}},")
                    if js != rSuit and jsLevel == 4:
                        print(f"\t{{'Bid': '{jsLevel}{js}', 'Criteria': [{self.replyCriteria[2]}]}},")
                    if rSuit != 'NT' and rLevel == 2:
                        print(f"\t{{'Bid': '{rLevel}NT', 'Criteria': [{self.replyCriteria[1]}]}},")
                    for ns in newSuits: 
                        o = copy.deepcopy(self.replyCriteria[3])
                        o['SuitLen'][ns[1:]] = [0, 1]
                        print(f"\t{{'Bid': '{ns}', 'Criteria': [{o}]}},")
                    if rSuit != 'NT' and rLevel <= 3:
                        print(f"\t{{'Bid': '{rLevel}NT', 'Criteria': [{self.replyCriteria[1]}]}},")
                    elif rSuit == 'NT' and rLevel < 3:
                        print(f"\t{{'Bid': '3NT', 'Criteria': [{self.replyCriteria[1]}]}},")
                    jsLevel = rLevel + (1 if rSuit == 'NT' or self.suits.index(s) >= self.suits.index(rSuit) else 0)
                    o = copy.deepcopy(self.replyCriteria[3])
                    o['Shape'] = 'Semi-Balanced'
                    print(f"\t{{'Bid': '{jsLevel}{s}', 'Criteria': [{o}]}}],")
                    print(f"\t'Seq': ['1{s}', '-', '{l}{js}', '-', '{rebid}', '-']}},")

if __name__ == '__main__':
    soloway = Soloway()
    soloway.genRules()
