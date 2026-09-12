#!/usr/bin/env python3

class Convention:
    def __init__(self):
        self.meta = {'Meta': {'Convention': ''}}
        self.suits = ['S', 'H', 'D', 'C']
        return

    def prtHeader(self, builtIn=False, flag=''):
        print(f"// {self.meta['Meta']['Convention']}")
        print("BidComponents.push({",end='')
        if flag is not '':
            print(f"'Flag': '{flag}',",end='')
        if builtIn:
            print("'BuildIn': 'Yes',", end='')
        print(f"  'Name': '{self.meta['Meta']['Convention']}',")