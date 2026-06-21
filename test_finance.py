import json
import sys
import urllib.request

def create_share_link(role):
    data = json.dumps({
        "role": role,
        "activityIds": [],
        "expiresInHours": 24
    }).encode('utf-8')
    req = urllib.request.Request(
        'http://localhost:3456/api/share/create',
        data=data,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
        return result['data']['token']

def get_share_data(token):
    with urllib.request.urlopen(f'http://localhost:3456/api/share/{token}') as resp:
        return json.loads(resp.read())

def main():
    token = create_share_link('finance')
    print(f'Finance token: {token}')
    print()
    
    data = get_share_data(token)
    d = data['data']
    
    print('=== Data Source Counts ===')
    print(f'registrationCount: {d.get("registrationCount")}')
    print(f'paymentCount: {d.get("paymentCount")}')
    print(f'lastRefreshedAt: {d.get("lastRefreshedAt")}')
    print()
    
    print('=== Finance areaHeatmap (verify no soldSeats/occupancyRate/rows.sold) ===')
    heatmap = d['areaHeatmap']
    for area in heatmap:
        keys = list(area.keys())
        print(f"Area {area['area']}:")
        print(f"  keys: {keys}")
        print(f"  has soldSeats: {'soldSeats' in area}")
        print(f"  has occupancyRate: {'occupancyRate' in area}")
        if area['rows']:
            r = area['rows'][0]
            rkeys = list(r.keys())
            print(f"  Row 1 keys: {rkeys}")
            print(f"  Row 1 has sold: {'sold' in r}")
            print(f"  Row 1 rate: {r.get('rate', 'N/A')}")
        print()

if __name__ == '__main__':
    main()
