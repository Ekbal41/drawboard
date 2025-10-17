<?php
$crawlerUserAgents = ['facebookexternalhit', 'Twitterbot', 'LinkedInBot', 'WhatsApp', 'Slackbot'];
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
$isCrawler = false;
foreach ($crawlerUserAgents as $agent) {
    if (stripos($userAgent, $agent) !== false) {
        $isCrawler = true;
        break;
    }
}
$routes = [
    // Shop page: /@username
    '#^/(@[0-9a-zA-Z_]+)$#'
    => 'https://api.dokanify.xyz/api/v1/prerender/shop-home/$1',

    // Product page: /@username/productId
    '#^/(@[0-9a-zA-Z_]+)/([0-9a-zA-Z-]+)$#'
    => 'https://api.dokanify.xyz/api/v1/prerender/product-details/$1/$2',
];
if ($isCrawler) {
    foreach ($routes as $pattern => $expressUrlTemplate) {
        if (preg_match($pattern, $_SERVER['REQUEST_URI'], $matches)) {
            $expressUrl = $expressUrlTemplate;
            for ($i = 1; $i < count($matches); $i++) {
                $expressUrl = str_replace('$' . $i, $matches[$i], $expressUrl);
            }
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $expressUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($response !== false && $httpCode == 200) {
                header('Content-Type: text/html');
                echo $response;
                exit;
            } else {
                http_response_code(500);
                echo '<html><body><h1>Error Contacting Dokanify Server!</h1></body></html>';
                exit;
            }
        }
    }
}
header('Content-Type: text/html');
readfile('index.html');
?>