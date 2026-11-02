package vn.duy.signlight.airecognition.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;

class AiInferenceClientTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    @Test
    void inferAlwaysSendsAJsonObjectInsteadOfFallingBackToXml() throws Exception {
        AtomicReference<String> contentType = new AtomicReference<>();
        AtomicReference<JsonNode> requestBody = new AtomicReference<>();
        HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/api/infer/features", exchange -> {
            contentType.set(exchange.getRequestHeaders().getFirst("Content-Type"));
            requestBody.set(JSON.readTree(exchange.getRequestBody()));
            byte[] response = ("{\"status\":\"ok\",\"label\":\"Anh\","
                    + "\"stableSignId\":\"anh\",\"confidence\":0.9,\"top3\":[],"
                    + "\"quality\":{\"handFrameRatio\":1.0,\"bothHandsRatio\":1.0,"
                    + "\"poseDetected\":true},\"inferenceLatencyMs\":1.0,"
                    + "\"retainedMedia\":false,\"stubMode\":false}")
                    .getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        });
        server.start();
        try {
            AiInferenceClient client = new AiInferenceClient(
                    "http://127.0.0.1:" + server.getAddress().getPort(), 5_000, "token");
            List<List<Float>> features = new ArrayList<>();
            for (int frame = 0; frame < 64; frame++) {
                features.add(new ArrayList<>(java.util.Collections.nCopies(327, 0.0f)));
            }

            assertThat(client.infer(features, "vsl-mvp30-v2-lite-transformer").status())
                    .isEqualTo("ok");
            assertThat(contentType.get()).startsWith("application/json");
            assertThat(requestBody.get().isObject()).isTrue();
            assertThat(requestBody.get().path("features").size()).isEqualTo(64);
        } finally {
            server.stop(0);
        }
    }
}
