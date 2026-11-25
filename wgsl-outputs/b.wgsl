const WORLD_SIZE: u32 = 512u;
const CHUNK_SIZE: u32 = 16u;

@group(0) @binding(0)
var<storage, read_write> pass_output_height: array<f32>;

struct ChunkUniforms {
    chunk_origin: vec2<f32>,
}

@group(0) @binding(1)
var<uniform> chunk: ChunkUniforms;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) invocation_id: vec3<u32>) {
    if invocation_id.x >= CHUNK_SIZE || invocation_id.y >= CHUNK_SIZE {
        return;
    }

    let world_position = vec2<f32>(invocation_id.xy) + chunk.chunk_origin;

    pass_output_height[invocation_id.y * CHUNK_SIZE + invocation_id.x] = 1.0 + 2.0;
}
