import discord
from discord.ext import commands

bot = commands.Bot(command_prefix="!")

# Fake profit data for testing (replace with real trading API later)
user_profits = {}

@bot.event
async def on_ready():
    print(f"Logged in as {bot.user}")

@bot.command()
async def profit(ctx, amount: int):
    """Log your trading profit and earn Zbucks"""
    user = ctx.author
    user_profits[user.id] = user_profits.get(user.id, 0) + amount
    zbucks = user_profits[user.id] // 10  # 1 Zbuck per $10 profit
    await ctx.send(f"{user.mention} earned {zbucks} Zbucks! Total profits: ${user_profits[user.id]}")

@bot.command()
async def store(ctx):
    """Check out the community store"""
    store_message = "Welcome to the Zbucks Store!\n- Exclusive Emoji: 50 Zbucks\n- Custom Role: 100 Zbucks\n- T-Shirt: 500 Zbucks"
    await ctx.send(store_message)

# Replace with your bot token
bot.run("YOUR_BOT_TOKEN_HERE")