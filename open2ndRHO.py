#!/usr/bin/env python3
# Generate support DBL rules

class SupportDBL:
    def __init__(self):
        return

    def genRules(self):
        self.printHeaders()
        self.printRules()
        print(']});')

    def printRules(self):
        suits = ['C', 'D', 'H', 'S']
        self.rules = []
        for s in suits:
            sIdx = suits.index(s)
            for res in [x for x in suits if x != s]:
                resLevel = 1 if suits.index(res) > sIdx else 2
                seq = [f'1{s}', '-', f'{resLevel}{res}']
                rhoChoices = [x for x in suits if x != s and x != res]
                rhoBids = []
                for rho in rhoChoices:
                    rhoLevel = resLevel if suits.index(rho) > suits.index(res) else resLevel + 1
                    rhoBids.append(dict(Bid=f'{rhoLevel}{rho}', Criteria=[dict(HCP=10,SuitLen=5)]))
                self.rules.append(dict(Seq=seq, Bids=rhoBids))
                for rho in rhoChoices:
                    rhoLevel = resLevel if suits.index(rho) > suits.index(res) else resLevel + 1
                    rebidLevel = rhoLevel if suits.index(res) > suits.index(rho) else rhoLevel + 1
                    bids = []
                    for b in ['X', f'{rebidLevel}{res}', f'{rhoLevel+1}{rho}']:
                        if b == 'X':
                            c = dict(SuitLen={})
                            c['SuitLen'][res] = 3
                            c['Meta'] = {'Notes': 'Support DBL'}
                        elif b[1] == res:
                            c = dict(SuitLen={})
                            c['SuitLen'][res] = 4
                        else:
                            c = dict(HCP=17)
                        bids.append(dict(Bid=b, Criteria=[c]))
                    self.rules.append(dict(Seq=seq + [f'{rhoLevel}{rho}'], Bids=bids))
                c = dict(SuitLen={})
                c['SuitLen'][res] = 3
                c['Meta'] = {'Notes': 'Support DBL'}
                self.rules.append(dict(Seq=seq + ['X'], Bids=[dict(Bid='XX', Criteria=[c])]))
        for r in self.rules:
            print(r,end=',\n')

    def printHeaders(self):
        headers = '''BidComponents.push({ 'BuildIn': true,
        'Flag': 'SupportDBL',
        'Name': 'Support DBL',
        'Rules': ['''
        print(headers)

if __name__ == '__main__':
    sDbl = SupportDBL()
    sDbl.genRules()