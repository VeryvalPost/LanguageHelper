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

    @Id
    @Column(name = "user_email")
    private String userEmail;

    @Id
    @Column(name = "authority")
    private String authority;
}