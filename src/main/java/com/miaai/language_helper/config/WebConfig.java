package com.miaai.language_helper.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.ssl.SslContextBuilder;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import javax.net.ssl.SSLException;
import java.time.Duration;

@Configuration
public class WebConfig {
    @Bean
    public WebClient webClient() {
        HttpClient httpClient = HttpClient.create()
                .secure(sslContextSpec -> {
                    try {
                        sslContextSpec
                                .sslContext(SslContextBuilder.forClient().build())
                                .handshakeTimeout(Duration.ofSeconds(30));
                    } catch (SSLException e) {
                        throw new RuntimeException(e);
                    }
                }) // Увеличить таймаут handshake до 30 сек
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 30000) // Таймаут соединения
                .responseTimeout(Duration.ofSeconds(60)) // Таймаут ответа
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(60)) // Таймаут чтения
                        .addHandlerLast(new WriteTimeoutHandler(60))); // Таймаут записи

        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }


}