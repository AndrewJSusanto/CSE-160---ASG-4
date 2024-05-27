class Sphere {
    constructor(){
        this.type = 'sphere';
        //this.position = [0.0, 0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        //this.size = 5.0;
        //this.sides = 3.0;
        this.matrix = new Matrix4();
        this.textureNum = -2; // -2 color, -1 uv, 0 tex0, else err
        this.verts32 = new Float32Array([]);

    }

    render(){
        //var xy = this.position;                                       // set xy to the ith point's pos field
        var rgba = this.color;                                          // set rgba to the ith point's color field
        //var size = this.size;                                           // set size to the ith point's size field
 
        // pass the texture number
        gl.uniform1i(u_whichTexture, this.textureNum);

        // Pass the color of a point to a u_FragColor uniform
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);  // Pass the color of point to u_FragColor
        //gl.uniform1f(u_Size, size);                                     // Pass the size of point to u_Size

        // Pass the matrix to u_ModelMatrix attribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // stepsize
        var d = Math.PI / 10;

        // delta
        // var dd = Math.PI / 100; 

        // make delta equal to stepsize for full sphere
        var dd = d;

        // var uv = [0, 0,  0, 0,   0, 0,   0, 0,    0, 0,    0, 0];


        for (var t = 0; t < Math.PI; t += d) {
            for (var r = 0; r < (2 * Math.PI); r += d) { // full rotation
                // parametric equations of sphere for xyz

                var p1 = [Math.sin(t) * Math.cos(r), Math.sin(t) * Math.sin(r), Math.cos(t)];
                var p2 = [Math.sin(t + dd) * Math.cos(r), Math.sin(t + dd) * Math.sin(r), Math.cos(t + dd)];
                var p3 = [Math.sin(t) * Math.cos(r + dd), Math.sin(t) * Math.sin(r + dd), Math.cos(t)];
                var p4 = [Math.sin(t + dd) * Math.cos(r + dd), Math.sin(t + dd) * Math.sin(r + dd), Math.cos(t + dd)];

                var v = [];
                var uv = [];

                v = v.concat(p1);   uv = uv.concat([0, 0]);
                v = v.concat(p2);   uv = uv.concat([0, 0]);
                v = v.concat(p4);   uv = uv.concat([0, 0]);

                gl.uniform4f(u_FragColor, 1, 1, 1, 1);
                // gl.uniform4f(u_FragColor, 0.9, 0.7, 0.5, 1);
                drawTriangle3DUVNormal(v, uv, v);
                // spheres position is equivalent to the normal

                v = [];
                uv = [];

                v = v.concat(p1);   uv = uv.concat([0, 0]);
                v = v.concat(p4);   uv = uv.concat([0, 0]);
                v = v.concat(p3);   uv = uv.concat([0, 0]);

                // gl.uniform4f(u_FragColor, 1, 1, 1, 1);
                gl.uniform4f(u_FragColor, 0.5, 0.5, 1, 1);
                drawTriangle3DUVNormal(v, uv, v);
            }
        }
    }

    renderfast() {
        // Optimization isn't rendering properly, even when following video exactly
        var rgba = this.color;

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniform1i(u_whichTexture, this.textureNum);
        
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // load all vertices into a single drawTriangle3D call (no UV);

        var vertices = [];
        // Front
        vertices = vertices.concat( [0, 0, 0,   1, 1, 0,   1, 0, 0] );
        vertices = vertices.concat( [0, 0, 0,   0, 1, 0,   1, 1, 0] );
        // Top
        vertices = vertices.concat( [0, 1, 0,   0, 1, 1,   1, 1, 1] );
        vertices = vertices.concat( [0, 1, 0,   1, 1, 1,   1, 1, 0] );
        // Left
        vertices = vertices.concat( [0, 0, 0,   0, 0, 1,   0, 1, 0] );
        vertices = vertices.concat( [0, 1, 1,   0, 0, 1,   0, 1, 0] );
        // Right
        vertices = vertices.concat( [1, 0, 1,   1, 1, 1,    1, 1, 0] );
        vertices = vertices.concat( [1, 0, 1,   1, 0, 0,    1, 1, 0] );
        // Back
        vertices = vertices.concat( [0, 0, 1,   1, 0, 1,    1, 1, 1] );
        vertices = vertices.concat( [0, 0, 1,   0, 1, 1,    1, 1, 1] );
        // Bottom
        vertices = vertices.concat( [0, 0, 0,   1, 0, 1,    0, 0, 1] );
        vertices = vertices.concat( [0, 0, 0,   1, 0, 0,    1, 0, 1] );

        drawTriangle3D(vertices);
    }

    renderfaster() {
        // Optimization isn't rendering properly, even when following video exactly
        var rgba = this.color;
        gl.uniform1i(u_whichTexture, -2);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // init
        drawTriangle3D(this.cubeVerts);
    }

    rendertest() {
        var rgba = this.color;

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniform1i(u_whichTexture, this.textureNum);
        
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

// Front Cube
        //gl.uniform4f(u_FragColor, 0, 0, 0, rgba[3]);
        drawTriangle3DUVNormal(
            [0, 0, 0,   1, 1, 0,    1, 0, 0],
            [0, 0, 1, 1, 1, 0],
            [0, 0, -1,  0, 0, -1,   0, 0, -1]
        );
        drawTriangle3DUVNormal(
            [0, 0, 0,   0, 1, 0,    1, 1, 0],
            [0, 0, 0, 1, 1, 1],
            [0, 0, -1,  0, 0, -1,   0, 0, -1]
        );
// Top Cube
        gl.uniform4f(u_FragColor, rgba[0] * 0.9, rgba[1] * 0.9, rgba[2] * 0.9, rgba[3]);
        //gl.uniform4f(u_FragColor, 0, 0, 0, rgba[3]);
        drawTriangle3DUVNormal(
            [0, 1, 0,   0, 1, 1,    1, 1, 1],
            [0, 0, 0, 1, 1, 1],
            [0, 1, 0,   0, 1, 0,    0, 1, 0]
        );
        drawTriangle3DUVNormal(
            [0, 1, 0,   1, 1, 1,    1, 1, 0],
            [1, 0, 0, 0, 1, 1],
            [0, 1, 0,   0, 1, 0,    0, 1, 0]
        );

// Left Cube
        gl.uniform4f(u_FragColor, rgba[0] * 0.7, rgba[1] * 0.7, rgba[2] * 0.7, rgba[3]);
        //gl.uniform4f(u_FragColor, 0, 0, 0, rgba[3]);

        drawTriangle3DUVNormal(
            [1, 1, 0,   1, 1, 1,    1, 0, 0],
            [0, 0, 0, 1, 1, 1],
            [1, 0, 0,   1, 0, 0,    1, 0, 0]
        );
        drawTriangle3DUVNormal(
            [1, 0, 0,   1, 1, 1,    1, 0, 1],
            [0, 0, 1, 1, 1, 0],
            [1, 0, 0,   1, 0, 0,    1, 0, 0]
        )

// Right Cube
        gl.uniform4f(u_FragColor, rgba[0] * 0.8, rgba[1] * 0.8, rgba[2] * 0.8, rgba[3]);
        //gl.uniform4f(u_FragColor, 0, 0, 0, rgba[3]);
        drawTriangle3DUVNormal(
            [0, 1, 0,   0, 1, 1,    0, 0, 0],
            [0, 0, 0, 1, 1, 1],
            [-1, 0, 0,  -1, 0, 0,   -1, 0, 0]
        );
        drawTriangle3DUVNormal(
            [0, 0, 0,   0, 1, 1,    0, 0, 1],
            [0, 0, 1, 1, 1, 0],
            [-1, 0, 0,  -1, 0, 0,   -1, 0, 0]
        );

// Back Cube
        gl.uniform4f(u_FragColor, rgba[0] * 0.6, rgba[1] * 0.6, rgba[2] * 0.6, rgba[3]);
        drawTriangle3DUVNormal(
            [0, 0, 1,   1, 0, 1,    1, 1, 1],
            [1, 0, 0, 0, 0, 1],
            [0, 0, 1,   0, 0, 1,    0, 0, 1]
        )
        drawTriangle3DUVNormal(
            [0, 0, 1,   0, 1, 1,    1, 1, 1],
            [1, 0, 1, 1, 0, 1],
            [0, 0, 1,   0, 0, 1,    0, 0, 1]
        )

// Bottom Cube
        gl.uniform4f(u_FragColor, rgba[0] * 0.5, rgba[1] * 0.5, rgba[2] * 0.5, rgba[3]);
        drawTriangle3DUVNormal(
            [0, 0, 0,   1, 0, 1,    0, 0, 1],
            [0, 1, 1, 0, 0, 0],
            [0, -1, 0,  0, -1, 0,   0, -1, 0]
        )
        drawTriangle3DUVNormal(
            [0, 0, 0,   1, 0, 0,    1, 0, 1],
            [0, 1, 1, 1, 1, 0],
            [0, -1, 0,  0, -1, 0,   0, -1, 0]
        )
    }
}
