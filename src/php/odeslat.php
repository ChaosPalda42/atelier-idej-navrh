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
        return ["chyby" => new stdClass(), "data" => [], "robot" => true];
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
        "chyby" => $chyby === [] ? new stdClass() : $chyby,
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

    $predmet = ocisti_hlavicku("Poptávka z webu: " . $jmeno);

    $radky = [
        "Jméno: " . $jmeno,
        "E-mail: " . $email,
        "Telefon: " . $telefon,
        "",
        $zprava,
    ];
    if ($prilohy !== []) {
        $radky[] = "";
        $radky[] = "Přílohy:";
        foreach ($prilohy as $priloha) {
            $radky[] = "- " . (string) $priloha["nazev"];
        }
    }
    $text = implode("\n", $radky);

    $hlavicky = [
        "From: " . ODESILATEL,
        "Reply-To: " . ocisti_hlavicku($email),
        "MIME-Version: 1.0",
    ];

    if ($prilohy === []) {
        $hlavicky[] = "Content-Type: text/plain; charset=utf-8";
        $telo = $text;
    } else {
        $hranice = "----hranice" . md5(uniqid((string) mt_rand(), true));
        $hlavicky[] = "Content-Type: multipart/mixed; boundary=\"$hranice\"";

        $casti = [];
        $casti[] = "--" . $hranice . "\r\n"
            . "Content-Type: text/plain; charset=utf-8\r\n"
            . "Content-Transfer-Encoding: base64\r\n\r\n"
            . chunk_split(base64_encode($text)) . "\r\n";
        foreach ($prilohy as $priloha) {
            $nazev = ocisti_hlavicku((string) $priloha["nazev"]);
            $typ = ocisti_hlavicku((string) $priloha["typ"]);
            $casti[] = "--" . $hranice . "\r\n"
                . "Content-Type: " . $typ . "; name=\"$nazev\"\r\n"
                . "Content-Transfer-Encoding: base64\r\n"
                . "Content-Disposition: attachment; filename=\"$nazev\"\r\n\r\n"
                . chunk_split(base64_encode((string) $priloha["obsah"])) . "\r\n";
        }
        $casti[] = "--" . $hranice . "--";
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
 * Hlídá, aby z jedné adresy nešlo vysypat schránku.
 *
 * Počty drží v souboru ve `slozka`, pojmenovaném podle hashu adresy —
 * IP se nikam neukládá čitelně. Vrací true, když už je adresa přes
 * LIMIT_POCET za posledních LIMIT_OKNO sekund; jinak false a pokus si
 * započítá. Nejde-li soubor přečíst ani zapsat, vrátí false.
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
        // Raději poptávku pustit než ji kvůli plnému disku zahodit.
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

    if (prilis_casto((string) ($_SERVER["REMOTE_ADDR"] ?? ""), sys_get_temp_dir(), time())) {
        http_response_code(429);
        echo json_encode(["ok" => false, "chyba" => "Zkuste to prosím za chvíli."], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $vysledek = zkontroluj($_POST);
    if ($vysledek["robot"]) {
        echo json_encode(["ok" => true], JSON_UNESCAPED_UNICODE);
        exit;
    }
    if ($vysledek["chyby"] !== []) {
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
