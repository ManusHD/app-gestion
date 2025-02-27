package com.manushd.app.ubicaciones.models;

import lombok.Data;

@Data
public class ProductoDescripcionUpdateDTO {
    private String ref;
    private String oldDescription;
    private String newDescription;
}

