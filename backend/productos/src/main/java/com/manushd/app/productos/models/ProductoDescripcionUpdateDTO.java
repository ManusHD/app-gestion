package com.manushd.app.productos.models;

import lombok.Data;

@Data
public class ProductoDescripcionUpdateDTO {
    private String ref;
    private String oldDescription;
    private String newDescription;
}
