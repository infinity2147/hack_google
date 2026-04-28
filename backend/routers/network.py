from fastapi import APIRouter
from simulation import NETWORK_NODES, NETWORK_EDGES, sir_model

router = APIRouter()


@router.get("/nodes")
def get_nodes():
    result = []
    for n in NETWORK_NODES:
        rt = sir_model.nodes.get(n["id"], {})
        result.append({
            **n,
            "sirState": rt.get("state", "S"),
            "infectionLevel": rt.get("infection", 0),
            "recoveryStep": rt.get("recovery_step"),
        })
    return result


@router.get("/edges")
def get_edges():
    return NETWORK_EDGES


@router.get("/stats")
def get_stats():
    from collections import Counter
    types = Counter(n["type"] for n in NETWORK_NODES)
    sir_counts = Counter(sir_model.nodes[n["id"]]["state"] for n in NETWORK_NODES)
    return {
        "totalNodes": len(NETWORK_NODES),
        "totalEdges": len(NETWORK_EDGES),
        "nodeTypes": dict(types),
        "sirCounts": {"S": sir_counts.get("S", 0), "I": sir_counts.get("I", 0), "R": sir_counts.get("R", 0)},
    }
