"""Geometrie pro převod výkresů na kresby (C-010).

Čára je seznam bodů [(x, y), …]; „čáry" je seznam takových čar.
Všechny funkce vracejí nové seznamy a vstup nemění.
"""
from __future__ import annotations

import math


def delka(cara) -> float:
    """Součet délek úseků čáry. Méně než dva body -> 0.0."""
    if len(cara) < 2:
        return 0.0
    return sum(math.dist(cara[i - 1], cara[i]) for i in range(1, len(cara)))


def ramecek(cary) -> tuple[float, float, float, float]:
    """(x_min, y_min, x_max, y_max) přes všechny body všech čar."""
    body = [b for cara in cary for b in cara]
    if not body:
        return (0.0, 0.0, 0.0, 0.0)
    xs = [b[0] for b in body]
    ys = [b[1] for b in body]
    return (float(min(xs)), float(min(ys)), float(max(xs)), float(max(ys)))


def _vzdalenost_od_usecky(bod, a, b) -> float:
    """Kolmá vzdálenost bodu od úsečky a–b; nulová úsečka -> vzdálenost od bodu."""
    ax, ay = a
    bx, by = b
    px, py = bod
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def zjednodus(cara, tolerance) -> list:
    """Ramer–Douglas–Peucker; zachová první a poslední bod."""
    if tolerance <= 0 or len(cara) < 3:
        return [tuple(b) for b in cara]
    p = [tuple(b) for b in cara]
    n = len(p)
    # index bodu s největší vzdáleností od úsečky p[0]–p[n-1]
    vzd = [0.0] * n
    for i in range(1, n - 1):
        vzd[i] = _vzdalenost_od_usecky(p[i], p[0], p[-1])
    if max(vzd) <= tolerance:
        return [p[0], p[-1]]
    i = max(range(1, n - 1), key=lambda k: vzd[k])
    return zjednodus(p[: i + 1], tolerance)[:-1] + zjednodus(p[i:], tolerance)


def zahod_kratke(cary, minimum) -> list:
    """Vyhodí čáry kratší než `minimum` a čáry kratší než dva body."""
    return [list(cara) for cara in cary if len(cara) >= 2 and delka(cara) >= minimum]


def spoj(cary, mezera) -> list:
    """Slévá čáry, které na sebe navazují (konec od začátku/konce druhé < mezera)."""
    zb = [list(cara) for cara in cary]
    pouzite = [False] * len(zb)
    vysledek = []
    for i in range(len(zb)):
        if pouzite[i] or not zb[i]:
            continue
        current = list(zb[i])
        pouzite[i] = True
        pokracovat = True
        while pokracovat:
            pokracovat = False
            for j in range(len(zb)):
                if pouzite[j] or not zb[j]:
                    continue
                if math.dist(current[-1], zb[j][0]) < mezera:
                    current.extend(zb[j][1:])
                    pouzite[j] = True
                    pokracovat = True
                    break
                if len(zb[j]) >= 2 and math.dist(current[-1], zb[j][-1]) < mezera:
                    current.extend(reversed(zb[j][:-1]))
                    pouzite[j] = True
                    pokracovat = True
                    break
        vysledek.append(current)
    return vysledek


def vmestnej(cary, sirka, vyska, okraj=0.0, obratit_y=True) -> list:
    """Zmenší/zvětší čáry do obdélníku (sirka × vyska) − okraj a vycentruje."""
    if not cary:
        return []
    x_min, y_min, x_max, y_max = ramecek(cary)
    s_kresby = x_max - x_min
    v_kresby = y_max - y_min
    dost_s = sirka - 2 * okraj
    dost_v = vyska - 2 * okraj
    if s_kresby > 0 and v_kresby > 0:
        meritko = min(dost_s / s_kresby, dost_v / v_kresby)
    elif s_kresby > 0:
        meritko = dost_s / s_kresby
    elif v_kresby > 0:
        meritko = dost_v / v_kresby
    else:
        meritko = 1.0
    ox = okraj + (dost_s - s_kresby * meritko) / 2
    oy = okraj + (dost_v - v_kresby * meritko) / 2
    vysledek = []
    for cara in cary:
        nova = []
        for x, y in cara:
            nx = (x - x_min) * meritko + ox
            ny = (y_max - y) * meritko + oy if obratit_y else (y - y_min) * meritko + oy
            nova.append((round(nx, 2), round(ny, 2)))
        vysledek.append(nova)
    return vysledek
