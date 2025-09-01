

# running instuctions: 
# to just view data: 
# python3 /path/to/script/profit-script.py
# to view plot:
# pip (or pip3) install matplotlib
# if it fails, make a venv
# python3 -m venv path/to/venv
# source path/to/venv/bin/activate (this will be different on windows)
# python3 -m pip install xyz

PRICE_FOR_ONE_MINER: float = 0.000001
miner_price = lambda m : PRICE_FOR_ONE_MINER * m ** 2
def calculate_sol_fees(users: int, should_print: bool = True) -> float:
    total: float = 0
    for i in range(users):
        total += miner_price(i)
    if should_print:
        print(f"Total fees for {users} miners: {total:.4f} SOL")
    return total

def generate_fee_array(limit: int = 10000) -> list[float]:
    totals: list[float] = []
    for i in range(limit):
        totals.append(calculate_sol_fees(i, False))
    return totals
def generate_fee_plot(limit: int = 10000):
    import matplotlib.pyplot as plt
    totals: list[float] = generate_fee_array(limit)
    price = [miner_price(i) for i in range(limit)]
    x = [i for i in range(len(totals))]
    plt.plot(x, totals, label="Profit", color="green")
    plt.plot(x, price, label="Mine price", color="blue")
    plt.yscale('log')
    plt.legend()
    plt.title("Profit and Mine price vs # of miners (log scale)")
    plt.savefig("plot.png")
    
    
calculate_sol_fees(50)
    

