"""
Simulate a full 6-round Job Jungle game directly via Supabase REST API.
Populates offers, hires, and balances with realistic wage negotiation data.
"""
import requests
import random
import json
import math

# Supabase config
SUPABASE_URL = "https://cusazigszphhomvpkywy.supabase.co"
API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1c2F6aWdzenBoaG9tdnBreXd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA3OTE5MCwiZXhwIjoyMDkxNjU1MTkwfQ.qvk8LIvm3iDjI4MSAnyRmCBg5coh1J06yno2YCn9JtA"
HEADERS = {
    "apikey": API_KEY,
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

GAME_ID = "2066a8d5-41e5-42d5-980f-3a9109b8a52b"

# Game constants (must match src/lib/constants.ts)
PINK_PxMP = [75, 45, 30, 15, 15, 0]
BLUE_PxMP = [120, 90, 75, 45, 30, 15]
KITE_PRICE = 15
PA_PINK = 15
PA_BLUE = 35

def supabase_get(table, params=""):
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?{params}", headers=HEADERS)
    r.raise_for_status()
    return r.json()

def supabase_post(table, data):
    r = requests.post(f"{SUPABASE_URL}/rest/v1/{table}", headers=HEADERS, json=data)
    r.raise_for_status()
    return r.json()

def supabase_patch(table, params, data):
    r = requests.patch(f"{SUPABASE_URL}/rest/v1/{table}?{params}", headers=HEADERS, json=data)
    r.raise_for_status()
    return r.json()

def supabase_delete(table, params):
    r = requests.delete(f"{SUPABASE_URL}/rest/v1/{table}?{params}", headers=HEADERS)
    r.raise_for_status()

def get_pxmp(skill, hire_number):
    """Get P x MP for the nth hire (1-indexed)."""
    schedule = BLUE_PxMP if skill == 'blue' else PINK_PxMP
    if hire_number < 1 or hire_number > len(schedule):
        return 0
    return schedule[hire_number - 1]

def main():
    random.seed(42)  # Reproducible simulation

    # 1. Clean existing offers and hires
    print("Cleaning existing data...")
    supabase_delete("hires", f"game_id=eq.{GAME_ID}")
    supabase_delete("offers", f"game_id=eq.{GAME_ID}")

    # 2. Get players
    players = supabase_get("players", f"game_id=eq.{GAME_ID}&order=name")
    employers = [p for p in players if p['role'] == 'employer']
    workers = [p for p in players if p['role'] == 'worker']

    print(f"Found {len(employers)} employers, {len(workers)} workers")

    # 3. Assign ~8 workers as blue (skilled)
    blue_workers = random.sample(workers, 8)
    blue_ids = {w['id'] for w in blue_workers}
    for w in blue_workers:
        supabase_patch("players", f"id=eq.{w['id']}", {"skill": "blue"})
        w['skill'] = 'blue'
    pink_workers = [w for w in workers if w['id'] not in blue_ids]
    print(f"Assigned {len(blue_workers)} blue, {len(pink_workers)} pink workers")

    # 4. Reset all balances to endowment
    for p in players:
        supabase_patch("players", f"id=eq.{p['id']}", {"balance": p['endowment']})
        p['balance'] = p['endowment']

    # Track balances locally
    balances = {p['id']: p['endowment'] for p in players}

    # 5. Simulate 6 rounds
    hire_order_global = 0
    all_hires = []

    for round_num in range(1, 7):
        print(f"\n--- Round {round_num} ---")
        round_hires = []

        # Each employer hires workers
        # Workers get shuffled each round (random matching)
        available_workers = list(workers)
        random.shuffle(available_workers)

        for emp in employers:
            emp_pink_hired = 0
            emp_blue_hired = 0
            emp_round_hires = []

            # Each employer tries to hire 2-4 workers (depending on profitability)
            max_hires = random.randint(2, 4)
            offers_made = 0

            for w in list(available_workers):
                if offers_made >= max_hires:
                    break

                skill = w['skill']
                if skill == 'blue':
                    hire_num = emp_blue_hired + 1
                else:
                    hire_num = emp_pink_hired + 1

                mp_value = get_pxmp(skill, hire_num)
                if mp_value <= 0:
                    continue

                # Workers demand wages — starts high in R1, converges to MP over rounds
                # Simulate wage convergence: wages approach P×MP as rounds progress
                noise_factor = max(0.15, 0.5 - 0.07 * round_num)  # decreasing noise
                if round_num == 1:
                    # Round 1: workers don't know MP, wages are scattered
                    wage = int(mp_value * random.uniform(0.3, 1.1))
                elif round_num <= 3:
                    # Rounds 2-3: learning, converging
                    wage = int(mp_value * random.uniform(0.5, 0.95))
                else:
                    # Rounds 4-6: near equilibrium
                    wage = int(mp_value * random.uniform(0.65, 0.9))

                wage = max(1, wage)  # minimum $1

                # Employer accepts if wage < MP (with some randomness)
                if wage < mp_value or (wage == mp_value and random.random() > 0.5):
                    # Create offer (accepted)
                    offer_data = {
                        "game_id": GAME_ID,
                        "round": round_num,
                        "worker_id": w['id'],
                        "employer_id": emp['id'],
                        "wage": wage,
                        "status": "accepted",
                    }
                    supabase_post("offers", offer_data)

                    # Create hire
                    hire_order_global += 1
                    hire_data = {
                        "game_id": GAME_ID,
                        "round": round_num,
                        "worker_id": w['id'],
                        "employer_id": emp['id'],
                        "wage": wage,
                        "worker_skill": skill,
                        "hire_order": hire_order_global,
                        "mp_value": mp_value,
                    }
                    result = supabase_post("hires", hire_data)
                    round_hires.append(result[0] if result else hire_data)

                    # Update worker balance
                    balances[w['id']] += wage
                    available_workers.remove(w)

                    if skill == 'blue':
                        emp_blue_hired += 1
                    else:
                        emp_pink_hired += 1

                    offers_made += 1
                    print(f"  {emp['employer_firm_name']} hired {w['name']} ({skill}) at ${wage} (MP=${mp_value})")
                else:
                    # Offer rejected
                    offer_data = {
                        "game_id": GAME_ID,
                        "round": round_num,
                        "worker_id": w['id'],
                        "employer_id": emp['id'],
                        "wage": wage,
                        "status": "rejected",
                    }
                    supabase_post("offers", offer_data)

        # Unemployed workers get PA
        hired_worker_ids = {h.get('worker_id') for h in round_hires}
        unemployed = [w for w in workers if w['id'] not in hired_worker_ids]
        for w in unemployed:
            pa = PA_BLUE if w['skill'] == 'blue' else PA_PINK
            balances[w['id']] += pa
            print(f"  {w['name']} unemployed → PA ${pa}")

        all_hires.extend(round_hires)
        print(f"  Round {round_num}: {len(round_hires)} hires, {len(unemployed)} unemployed")

        # Education upgrade: pink workers with balance >= 25 have 30% chance (rounds 2-5)
        if round_num >= 2 and round_num <= 5:
            for w in workers:
                if w['skill'] == 'pink' and balances[w['id']] >= 25 and random.random() < 0.25:
                    balances[w['id']] -= 25
                    w['skill'] = 'blue'
                    print(f"  ** {w['name']} upgraded to BLUE (balance now ${balances[w['id']]})")

    # 6. Update all player balances in DB
    print("\nUpdating final balances...")
    for p in players:
        supabase_patch("players", f"id=eq.{p['id']}", {"balance": balances[p['id']], "skill": p.get('skill', 'pink')})

    # 7. Update game status to ended
    supabase_patch("games", f"id=eq.{GAME_ID}", {
        "status": "ended",
        "current_round": 6,
    })

    # Print summary
    print("\n=== FINAL STANDINGS ===")
    print("\nWorkers:")
    worker_standings = sorted(workers, key=lambda w: balances[w['id']], reverse=True)
    for w in worker_standings:
        print(f"  {w['name']:20s}  {w['skill']:5s}  endow=${w['endowment']:2d}  final=${balances[w['id']]:4d}")

    print("\nEmployers:")
    for emp in employers:
        emp_hires = [h for h in all_hires if h.get('employer_id') == emp['id']]
        revenue = sum(h.get('mp_value', 0) for h in emp_hires)
        wages = sum(h.get('wage', 0) for h in emp_hires)
        profit = revenue - wages
        print(f"  {emp['employer_firm_name']:10s} ({emp['name']:20s})  revenue=${revenue:4d}  wages=${wages:4d}  profit=${profit:4d}")

    total_hires = len(all_hires)
    print(f"\nTotal hires across 6 rounds: {total_hires}")
    print(f"\nResults page: https://job-jungle-app.vercel.app/game/{GAME_ID}/results")

if __name__ == "__main__":
    main()
