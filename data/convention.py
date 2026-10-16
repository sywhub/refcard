#!/usr/bin/env python3
""" Common code for convention generation """

class Convention:
    def __init__(self):
        self.meta = {'Convention': ''}
        self.suits = ['S', 'H', 'D', 'C']
        self.rules = []
        return

    def prtHeader(self, builtIn=False, flag=''):
        print(f"// {self.meta['Convention']}")
        print("BidComponents.push({",end='')
        if not builtIn and flag:
            print(f"'Flag': '{flag}',",end=' ')
        if builtIn:
            print("'BuilDIn': 'Yes',", end=' ')
        print(f"'Name': '{self.meta['Convention']}',")

    def startBids(self):
        self.newBidLine = False
        print("\t{'Bids': [",end='')

    # compute bid level increment
    def bidLevelInc(self, bidSuit, prior, twoAhead=''):
        comp = prior
        if prior == 'X' or prior == '-':
            comp = twoAhead
        inc = 0 if (bidSuit == 'X' or bidSuit == '-') or self.suits.index(bidSuit) < self.suits.index(comp) else 1
        return inc

    def printRules(self, builtIn=False):
        self.prtHeader(builtIn=builtIn, flag=self.meta['Convention'])
        print(f"{' '*4}'Rules': [")
        for r in self.rules:
            self.startBids()
            firstBid = True
            for b in r['Bids']:
                if not firstBid:
                    print('\t\t',end='')
                firstBid = False
                print(b, end='')
                if b is not r['Bids'][-1]:
                    print(',')
            print('],')
            print(f"\t'Seq': {r['Seq']}}}",end='')
            if r is not self.rules[-1]:
                print(',')
        print(f"\n{' '*4}]}});")

