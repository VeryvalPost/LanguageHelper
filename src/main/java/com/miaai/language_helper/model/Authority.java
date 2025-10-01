package com.miaai.language_helper.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Table(name = "authorities")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Authority {

    @EmbeddedId
    private AuthorityId id;

    // Конструктор для удобства
    public Authority(String userEmail, String authority) {
        this.id = new AuthorityId(userEmail, authority);
    }

    // Геттеры и сеттеры для отдельных полей (опционально)
    public String getUserEmail() {
        return id != null ? id.getUserEmail() : null;
    }

    public void setUserEmail(String userEmail) {
        if (id == null) {
            id = new AuthorityId();
        }
        id.setUserEmail(userEmail);
    }

    public String getAuthority() {
        return id != null ? id.getAuthority() : null;
    }

    public void setAuthority(String authority) {
        if (id == null) {
            id = new AuthorityId();
        }
        id.setAuthority(authority);
    }
}