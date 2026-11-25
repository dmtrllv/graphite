const WORLD_SIZE : u32 = 512u;
const CHUNK_SIZE : u32 = 16u;

@group(0) @binding(0)
var<storage, read> pass_buffer_0 : array<f32>;

@group(0) @binding(1)
var<storage, read> pass_buffer_1 : array<vec3 < f32>>;

@group(0) @binding(2)
var<storage, read_write> pass_output_elevation : array<f32>;

@group(0) @binding(3)
var<storage, read_write> pass_output_normal : array<vec3 < f32>>;

struct ChunkUniforms {
    chunk_origin : vec2 < f32>
};
@group(0) @binding(4)
var<uniform> chunk : ChunkUniforms;
@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) invocation_id : vec3 < u32>)
{
    if (invocation_id.x >= CHUNK_SIZE || invocation_id.y >= CHUNK_SIZE) {
        return;
	}

    let world_position = vec2 < f32 > (invocation_id.xy) + chunk.chunk_origin;

    pass_output_elevation[invocation_id.y * CHUNK_SIZE + invocation_id.x] = pass_buffer_0[u32(world_position.y - chunk.chunk_origin.y) * CHUNK_SIZE + u32(world_position.x - chunk.chunk_origin.x)];
    pass_output_normal[invocation_id.y * CHUNK_SIZE + invocation_id.x] = pass_buffer_1[u32(world_position.y - chunk.chunk_origin.y) * CHUNK_SIZE + u32(world_position.x - chunk.chunk_origin.x)];
}
