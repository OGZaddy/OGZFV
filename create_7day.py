import json
data = json.load(open('polygon-btc-1y.json'))
# Take last 168 hours (7 days)
seven_day = data[-168:]
json.dump(seven_day, open('btc-7days.json', 'w'))
print(f'7-day range: ${seven_day[0]["close"]:,.0f} to ${seven_day[-1]["close"]:,.0f}')
print(f'Candles: {len(seven_day)}')