import matplotlib.pyplot as plt

LAMPORTS_PER_SOL = 1000000000
FEE = LAMPORTS_PER_SOL / 1000000
RELEASE_AMOUNT = 100000


def calculate_sol_fee(bids: float) -> float:
    return FEE * bids ** 2 / LAMPORTS_PER_SOL

def calculate_release_amount(releases: float) -> float:
    return RELEASE_AMOUNT * releases ** 2

def calculate_bid_reward(balance: float, bids: float) -> float:
    sum = bids * (bids + 1) / 2
    return balance / sum