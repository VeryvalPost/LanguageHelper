package com.miaai.language_helper.model;

import java.io.Serializable;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class AuthorityId implements Serializable {
    @Column(name = "user_email")
    private String userEmail;

    @Column(name = "authority")
    private String authority;

    // Конструкторы
    public AuthorityId() {}

    public AuthorityId(String userEmail, String authority) {
        this.userEmail = userEmail;
        this.authority = authority;
    }

    // Геттеры и сеттеры
    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getAuthority() {
        return authority;
    }

    public void setAuthority(String authority) {
        this.authority = authority;
    }

    // hashCode и equals для корректной работы составного ключа
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AuthorityId that = (AuthorityId) o;
        return userEmail.equals(that.userEmail) && authority.equals(that.authority);
    }

    @Override
    public int hashCode() {
        return userEmail.hashCode() * 31 + authority.hashCode();
    }
}