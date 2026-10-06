<?php

declare(strict_types=1);

/**
 * C-014 — Příjem poptávky z formuláře a odeslání mailem.
 *
 * Holé PHP bez knihoven. Skript jde načíst (require) bez vedlejších účinků:
 * z příkazové řádky nic nevypíše, nic neodešle a nic nezapiše.
 */

const PRIJEMCE = "info@atelieridej.cz";
const ODESILATEL = "web@atelieridej.cz";

const LIMIT_POCET = 5;      // počet poptávek z jedné adresy za okno
const LIMIT_OKNO = 3600;    // délka okna v sekundách

/**
 * Z textu určeného do hlavičky mailu vyhodí \r, \n a \0 (tudy se podstrkují
 * cizí příjemci) a ořízne na 200 znaků. Nic jiného nemění.
 */
function ocisti_hlavicku(string $text): string
{
    $text = str_replace(["\r", "\n", "\0"], "", $text);
    return substr($text, 0, 200);
}

/**
 * Zkontroluje pole poptávky.
 *
 * @return array{chyby: array<string,string>, data: array<string,string>, robot: bool}
 */
function zkontroluj(array $data): array
{
    $data = array_map(
        static fn($v): string => is_scalar($v) ? trim((string) $v) : "",
        $data
    );

    $jmeno = $data["jmeno"] ?? "";
    $email = $data["email"] ?? "";
    $telefon = $data["telefon"] ?? "";
    $zprava = $data["zprava"] ?? "";
    $souhlas = $data["souhlas"] ?? "";
    $vzkaz = $data["vzkaz"] ?? "";

    // Past na roboty: skryté pole vyplní jen robot. Poptávku zahodíme,
    // ale tváříme se, že prošla — jinak si robot vyzkouší jinou cestu.
    if ($vzkaz !== "") {
        return ["chyby" => [], "data" => [], "robot" => true];
    }

    $chyby = [];
    if (mb_strlen($jmeno) < 2) {
        $chyby["jmeno"] = "Uveďte prosím jméno.";
    }
    if ($email === "" || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        $chyby["email"] = "Uveďte prosím platný e-mail.";
    }
    if (mb_strlen($zprava) < 10) {
        $chyby["zprava"] = "Napište prosím, o co máte zájem.";
    }
    if ($souhlas === "") {
        $chyby["souhlas"] = "Bez souhlasu se zpracováním údajů nemůžeme odpovědět.";
    }

    return [
        "chyby" => $chyby,
        "data" => [
            "jmeno" => $jmeno,
            "email" => $email,
            "telefon" => $telefon,
            "zprava" => $zprava,
        ],
        "robot" => false,
    ];
}

/**
 * Složí mail z poptávky a příloh.
 *
 * Zpráva má vždy dvě podoby vedle sebe (multipart/alternative): prostý
 * text v UTF-8 a čitelně vysázené HTML. Jsou-li přílohy, obalí je navenek
 * multipart/mixed.
 *
 * @param array<string,string> $data
 * @param array<array{nazev: string, typ: string, obsah: string}> $prilohy
 * @return array{predmet: string, telo: string, hlavicky: string}
 */
function sestav_mail(array $data, array $prilohy): array
{
    $jmeno = (string) ($data["jmeno"] ?? "");
    $email = (string) ($data["email"] ?? "");
    $telefon = (string) ($data["telefon"] ?? "");
    $zprava = (string) ($data["zprava"] ?? "");

    // VŠECHNO, co přišlo z formuláře, projde htmlspecialchars() s ENT_QUOTES —
    // do pošty se nesmí dostat cizí značky. Nic dalšího se neodstraňuje:
    // escapování stačí a mazání znaků (třeba "=") komolí běžné věty.
    $h = static fn(string $s): string => htmlspecialchars($s, ENT_QUOTES, "UTF-8");

    $predmet = ocisti_hlavicku("Poptávka z webu: " . $jmeno);

    // --- prostý text -------------------------------------------------
    // I do prostého textu se nesmí dostat cizí značky.
    $radky = [
        "Jméno: " . $h($jmeno),
        "E-mail: " . $h($email),
        "Telefon: " . $h($telefon),
        "",
        $h($zprava),
    ];
    if ($prilohy !== []) {
        $radky[] = "";
        $radky[] = "Přílohy:";
        foreach ($prilohy as $priloha) {
            $radky[] = "- " . (string) $priloha["nazev"];
        }
    }
    $text = implode("\n", $radky);

    // --- HTML --------------------------------------------------------
    $papirov = "#faf6ee";
    $tust = "#221f1b";
    $tlumena = "#8a8173";
    $oranzova = "#ff8000";
    $pismo = "font-family: Arial, Helvetica, sans-serif;";

    $html = "<!DOCTYPE html>\n"
        . "<html>\n<head>\n<meta charset=\"utf-8\">\n</head>\n"
        . "<body style=\"margin:0; padding:0; background-color:$papirov; $pismo color:$tust;\">"
        . "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color:$papirov;\">"
        . "<tr><td align=\"center\" style=\"padding:24px 12px;\">"
        . "<table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"width:600px; max-width:600px; background-color:#ffffff; border:1px solid #e5ded1;\">"
        . "<tr><td style=\"padding:28px 32px;\">"
        . "<h1 style=\"margin:0 0 4px; font-size:22px; line-height:1.3; color:$tust;\">Poptávka z webu</h1>"
        . "<p style=\"margin:0 0 20px; font-size:13px; color:$tlumena;\">Nová poptávka z kontaktního formuláře</p>"
        . "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;\">"
        . "<tr><td style=\"padding:6px 0; font-size:14px; color:$tlumena; width:110px; vertical-align:top;\">Jméno</td>"
        . "<td style=\"padding:6px 0; font-size:14px; color:$tust;\">" . $h($jmeno) . "</td></tr>"
        . "<tr><td style=\"padding:6px 0; font-size:14px; color:$tlumena; vertical-align:top;\">E-mail</td>"
        . "<td style=\"padding:6px 0; font-size:14px; color:$tust;\"><a href=\"mailto:" . $h($email) . "\" style=\"color:$oranzova;\">" . $h($email) . "</a></td></tr>"
        . "<tr><td style=\"padding:6px 0; font-size:14px; color:$tlumena; vertical-align:top;\">Telefon</td>"
        . "<td style=\"padding:6px 0; font-size:14px; color:$tust;\">" . ($telefon !== "" ? "<a href=\"tel:" . $h($telefon) . "\" style=\"color:$oranzova;\">" . $h($telefon) . "</a>" : "") . "</td></tr>"
        . "<tr><td style=\"padding:6px 0; font-size:14px; color:$tlumena; vertical-align:top;\">Zpráva</td>"
        . "<td style=\"padding:6px 0; font-size:14px; color:$tust;\">" . nl2br($h($zprava)) . "</td></tr>";

    if ($prilohy !== []) {
        $seznam = "";
        foreach ($prilohy as $priloha) {
            $seznam .= "<li style=\"margin:0 0 4px;\">" . $h((string) $priloha["nazev"]) . "</li>";
        }
        $html .= "<tr><td style=\"padding:6px 0; font-size:14px; color:$tlumena; vertical-align:top;\">Přílohy</td>"
            . "<td style=\"padding:6px 0; font-size:14px; color:$tust;\"><ul style=\"margin:0; padding-left:18px;\">$seznam</ul></td></tr>";
    }

    $html .= "</table>"
        . "<p style=\"margin:24px 0 0; font-size:12px; color:$tlumena;\">Tato zpráva přišla z webu atelieridej.cz.</p>"
        . "</td></tr></table>"
        . "</td></tr></table>"
        . "</body>\n</html>\n";

    // --- hlavičky ----------------------------------------------------
    $hlavicky = [
        "From: " . ODESILATEL,
        "Reply-To: " . ocisti_hlavicku($email),
        "MIME-Version: 1.0",
    ];

    $hranice_alt = "alt" . md5(uniqid((string) mt_rand(), true));

    $alternativa = "--$hranice_alt\r\n"
        . "Content-Type: text/plain; charset=utf-8\r\n"
        . "Content-Transfer-Encoding: 8bit\r\n\r\n"
        . $text . "\r\n"
        . "--$hranice_alt\r\n"
        . "Content-Type: text/html; charset=utf-8\r\n"
        . "Content-Transfer-Encoding: 8bit\r\n\r\n"
        . $html . "\r\n"
        . "--$hranice_alt--";

    if ($prilohy === []) {
        $hlavicky[] = "Content-Type: multipart/alternative; boundary=\"$hranice_alt\"";
        $telo = $alternativa;
    } else {
        $hranice_mix = "mix" . md5(uniqid((string) mt_rand(), true));
        $hlavicky[] = "Content-Type: multipart/mixed; boundary=\"$hranice_mix\"";

        $casti = [];
        $casti[] = "--$hranice_mix\r\n"
            . "Content-Type: multipart/alternative; boundary=\"$hranice_alt\"\r\n\r\n"
            . $alternativa;
        foreach ($prilohy as $priloha) {
            $nazev = ocisti_hlavicku((string) $priloha["nazev"]);
            $typ = ocisti_hlavicku((string) $priloha["typ"]);
            $casti[] = "--$hranice_mix\r\n"
                . "Content-Type: $typ; name=\"$nazev\"\r\n"
                . "Content-Transfer-Encoding: base64\r\n"
                . "Content-Disposition: attachment; filename=\"$nazev\"\r\n\r\n"
                . chunk_split(base64_encode((string) $priloha["obsah"]));
        }
        $casti[] = "--$hranice_mix--";
        $telo = implode("\r\n", $casti);
    }

    return [
        "predmet" => $predmet,
        "telo" => $telo,
        "hlavicky" => implode("\r\n", $hlavicky),
    ];
}

/**
 * Z $_FILES udělá pole pro sestav_mail().
 *
 * Typ přílohy se určuje podle přípony z pevné tabulky, nikdy z
 * $_FILES["type"] — ten posílá prohlížeč a dá se podvrhnout.
 *
 * @param array $soubory
 * @return array<array{nazev: string, typ: string, obsah: string}>
 */
function nacti_prilohy(array $soubory): array
{
    static $typy = [
        "pdf" => "application/pdf",
        "jpg" => "image/jpeg",
        "jpeg" => "image/jpeg",
        "png" => "image/png",
        "dwg" => "image/vnd.dwg",
        "dxf" => "image/vnd.dxf",
        "doc" => "application/msword",
        "docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "xls" => "application/vnd.ms-excel",
        "xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    $limit_souboru = 10 * 1024 * 1024;
    $limit_cely = 10 * 1024 * 1024;

    $polozky = [];
    if (isset($soubory["name"]) && is_array($soubory["name"])) {
        $pocet = count($soubory["name"]);
        for ($i = 0; $i < $pocet; $i++) {
            $polozky[] = [
                "name" => (string) ($soubory["name"][$i] ?? ""),
                "tmp_name" => (string) ($soubory["tmp_name"][$i] ?? ""),
                "error" => (int) ($soubory["error"][$i] ?? UPLOAD_ERR_NO_FILE),
                "size" => (int) ($soubory["size"][$i] ?? 0),
            ];
        }
    } elseif (isset($soubory["name"])) {
        $polozky[] = [
            "name" => (string) $soubory["name"],
            "tmp_name" => (string) ($soubory["tmp_name"] ?? ""),
            "error" => (int) ($soubory["error"] ?? UPLOAD_ERR_NO_FILE),
            "size" => (int) ($soubory["size"] ?? 0),
        ];
    }

    $prilohy = [];
    $soucet = 0;
    foreach ($polozky as $polozka) {
        if ($polozka["error"] !== UPLOAD_ERR_OK) {
            continue;
        }
        $nazev = basename((string) $polozka["name"]);
        if ($nazev === "" || $nazev === "." || $nazev === "..") {
            continue;
        }
        $priloha = strtolower(pathinfo($nazev, PATHINFO_EXTENSION));
        if (!isset($typy[$priloha])) {
            continue;
        }
        if ($polozka["size"] <= 0 || $polozka["size"] > $limit_souboru) {
            continue;
        }
        if ($soucet + $polozka["size"] > $limit_cely) {
            continue;
        }
        if (!is_file($polozka["tmp_name"]) || !is_readable($polozka["tmp_name"])) {
            continue;
        }
        $obsah = file_get_contents($polozka["tmp_name"]);
        if ($obsah === false) {
            continue;
        }
        $soucet += $polozka["size"];
        $prilohy[] = [
            "nazev" => $nazev,
            "typ" => $typy[$priloha],
            "obsah" => $obsah,
        ];
    }

    return $prilohy;
}

/**
 * Kde bydlí počítadla poptávek. JEDNA společná cesta pro celý web — nikdy
 * ne podle getmypid() ani jinak podle procesu, protože každý požadavek
 * obsluhuje jiný proces PHP a limit by pak nelimitoval nic.
 */
function slozka_pocitadla(): string
{
    // Proměnná prostředí umožní počítadlo odklonit jinam (testy, uklízení).
    $prepsano = getenv("IDEJ_POCITADLO");
    if (is_string($prepsano) && $prepsano !== "") {
        return $prepsano;
    }
    $slozka = sys_get_temp_dir() . "/idej-poptavky";
    if (!is_dir($slozka) && !@mkdir($slozka, 0700, true)) {
        return sys_get_temp_dir();
    }
    return $slozka;
}

/**
 * Hlídá, aby z jedné adresy nešlo vysypat schránku.
 *
 * Počty drží v souboru ve `slozka`, pojmenovaném podle hashu adresy —
 * IP se nikam neukládá čitelně. Vrací true, když už je adresa přes
 * LIMIT_POCET za posledních LIMIT_OKNO sekund; jinak false a pokus si
 * započítá. Nejde-li soubor přečíst ani zapsat, vrátí false (raději
 * poptávku pustit než ji kvůli plnému disku zahodit).
 */
function prilis_casto(string $ip, string $slozka, int $nyni): bool
{
    $soubor = $slozka . "/" . hash("sha256", $ip);

    $zaznamy = [];
    if (is_file($soubor)) {
        $obsah = @file_get_contents($soubor);
        if ($obsah !== false) {
            $dekodovano = json_decode($obsah, true);
            if (is_array($dekodovano)) {
                foreach ($dekodovano as $cas) {
                    if (is_int($cas) && $cas > $nyni - LIMIT_OKNO) {
                        $zaznamy[] = $cas;
                    }
                }
            }
        }
    }

    if (count($zaznamy) >= LIMIT_POCET) {
        return true;
    }

    $zaznamy[] = $nyni;
    if (@file_put_contents($soubor, json_encode($zaznamy), LOCK_EX) === false) {
        return false;
    }

    return false;
}

/**
 * Složí mail a pošle přes mail(). Vrací, co vrátila mail().
 *
 * @param array<string,string> $data
 * @param array<array{nazev: string, typ: string, obsah: string}> $prilohy
 */
function odesli(array $data, array $prilohy): bool
{
    $mail = sestav_mail($data, $prilohy);
    // Predmet je v UTF-8, proto ho pro hlavičku zakódujeme.
    $predmet = "=?UTF-8?B?" . base64_encode($mail["predmet"]) . "?=";
    return mail(PRIJEMCE, $predmet, $mail["telo"], $mail["hlavicky"]);
}

if (PHP_SAPI !== "cli") {
    // Odpověď je vždy JSON; žádné chyby PHP se do ní nedostanou.
    error_reporting(E_ALL);
    ini_set("display_errors", "0");
    set_exception_handler(static function (Throwable $e): void {
        http_response_code(500);
        header("Content-Type: application/json; charset=utf-8");
        echo json_encode(["ok" => false, "chyba" => "Zprávu se nepodařilo odeslat."], JSON_UNESCAPED_UNICODE);
        exit;
    });

    if (($_SERVER["REQUEST_METHOD"] ?? "GET") !== "POST") {
        http_response_code(405);
        header("Content-Type: application/json; charset=utf-8");
        echo json_encode(["ok" => false, "chyba" => "Pouze POST."], JSON_UNESCAPED_UNICODE);
        exit;
    }

    header("Content-Type: application/json; charset=utf-8");

    // Počítadla držíme v jedné společné složce pro celý web.
    if (prilis_casto((string) ($_SERVER["REMOTE_ADDR"] ?? ""), slozka_pocitadla(), time())) {
        http_response_code(429);
        echo json_encode(["ok" => false, "chyba" => "Zkuste to prosím za chvíli."], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $vysledek = zkontroluj($_POST);
    if ($vysledek["robot"]) {
        echo json_encode(["ok" => true], JSON_UNESCAPED_UNICODE);
        exit;
    }
    // O tom, jestli jsou chyby, rozhodujeme POČTEM — prázdná mapa se
    // podle typu nemusí rovnat prázdnému poli a odmítly by se i
    // bezchybné poptávky.
    if (count($vysledek["chyby"]) > 0) {
        http_response_code(422);
        echo json_encode(["ok" => false, "chyby" => $vysledek["chyby"]], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $prilohy = nacti_prilohy($_FILES);
    if (odesli($vysledek["data"], $prilohy)) {
        echo json_encode(["ok" => true], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(500);
        echo json_encode(["ok" => false, "chyba" => "Zprávu se nepodařilo odeslat."], JSON_UNESCAPED_UNICODE);
    }
}
