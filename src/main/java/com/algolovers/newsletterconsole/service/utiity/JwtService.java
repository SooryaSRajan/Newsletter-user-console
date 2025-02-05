package com.algolovers.newsletterconsole.service.utiity;

import com.algolovers.newsletterconsole.data.entity.user.Authority;
import com.algolovers.newsletterconsole.data.entity.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtService {

    @Value("${newsletter.jwt.secret}")
    private String SECRET;
    public static final String VALIDITY_CODE_KEY = "validityCode";

    public String getUserIdFromToken(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts
                .parserBuilder()
                .setSigningKey(getSignKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public Boolean validateToken(String token, User user) {
        final String id = getUserIdFromToken(token);
        final String validityCode = extractAllClaims(token).get(VALIDITY_CODE_KEY, String.class);
        return (id.equals(user.getId()) && !isTokenExpired(token) && validityCode.equals(user.getAccountValidityCode()));
    }

    public String generateToken(User user, String validityCode) {
        Map<String, Object> claims = new HashMap<>();
        Collection<Authority> authorities = user.getAuthorities();
        if (authorities.contains(Authority.ADMIN)) {
            claims.put(Authority.ADMIN.getAuthority(), true);
        }
        if (authorities.contains(Authority.USER)) {
            claims.put(Authority.USER.getAuthority(), true);
        }

        claims.put(VALIDITY_CODE_KEY, validityCode);
        return createToken(claims, user.getId());
    }

    private String createToken(Map<String, Object> claims, String id) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(id)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 12))
                .signWith(getSignKey(), SignatureAlgorithm.HS256).compact();
    }

    private Key getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(SECRET);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
