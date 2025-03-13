package com.manushd.app.autenticacion.service;

import com.manushd.app.autenticacion.models.User;
import com.manushd.app.autenticacion.models.RegisterRequest;
import com.manushd.app.autenticacion.models.Role;
import com.manushd.app.autenticacion.models.UpdateUserRequest;
import com.manushd.app.autenticacion.repository.RoleRepository;
import com.manushd.app.autenticacion.repository.UserRepository;

import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
 
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    public User save(User user) {
        return userRepository.save(user);
    }

    public Iterable<User> getUsers() {
        return userRepository.findAll();
    }

    public User registerUser(RegisterRequest request) throws Exception {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new Exception("El usuario ya existe.");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // 🔐 Se encripta la contraseña

        // Obtener el rol desde la base de datos
        Set<Role> roles = new HashSet<>();
        System.out.println(request.getRole());
        Role role = roleRepository.findByName(request.getRole().toUpperCase())
                .orElseThrow(() -> new Exception("Rol no válido."));
        
        roles.add(role);
        user.setRoles(roles);

        return userRepository.save(user);
    }
    
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                     .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con username: " + username));
        
        Collection<GrantedAuthority> authorities = user.getRoles().stream()
            .map(role -> new SimpleGrantedAuthority(role.getName()))
            .collect(Collectors.toList());
            
        return new org.springframework.security.core.userdetails.User(user.getUsername(), user.getPassword(), authorities);
    }

    public User updateUser(String username, UpdateUserRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    
        if (request.getNewPassword() != null && !request.getNewPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }
        if (request.getRole() != null && !request.getRole().isEmpty()) {
            Role newRole = roleRepository.findByName(request.getRole())
                    .orElseThrow(() -> new RuntimeException("Rol no encontrado: " + request.getRole()));
            user.setRoles(Collections.singleton(newRole));
        }
    
        return userRepository.save(user);
    }
    
    public void deleteUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        userRepository.delete(user);
    }
    
    
    

}
