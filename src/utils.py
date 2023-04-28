import time


def log(*args):
    print(*args, flush=True)


def get_now_timestamp():
    return int(time.time())


def all_avatar():
    return [
        'Nintendo_Switch_Princess_Zelda_TWWHD_Icon.png',
        'Nintendo_Switch_Urbosa_Icon.png',
        'Nintendo_Switch_Daruk_Icon.png',
        'Nintendo_Switch_Revali_Icon.png',
        'Nintendo_Switch_Guardian_Icon.png',
        'Nintendo_Switch_Master_Sword_Hylian_Shield_Icon.png',
        'Nintendo_Switch_Link_Series_Icon.png',
        'Nintendo_Switch_Link_BotW_Icon.png',
        'Nintendo_Switch_Wingcrest_Icon.png',
        'Nintendo_Switch_Bokoblin_Icon.png',
        'Nintendo_Switch_Daruk_Icon-1.png',
        'Nintendo_Switch_Zelda_BotW_Icon.png',
        'Nintendo_Switch_Ganondorf_TWWHD_Icon.png',
        'Nintendo_Switch_funny.png',
        'Nintendo_Switch_Mipha_Icon.png',
        'Nintendo_Switch_Link_TWWHD_Icon.png',
        'Nintendo_Switch_Ganondorf_TPHD_Icon.png',
        'Nintendo_Switch_Princess_Zelda_TPHD_Icon.png',
        'Nintendo_Switch_Kass_Icon.png',
        'Nintendo_Switch_Link_TP_Icon.png',
    ]


def timestamp_to_date(t):
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(t))
