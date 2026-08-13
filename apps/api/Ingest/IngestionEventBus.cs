using System.Collections.Concurrent;
using System.Runtime.CompilerServices;
using System.Threading.Channels;
using NewsFeed.Api.Dtos;

namespace NewsFeed.Api.Ingest;

public sealed class IngestionEventBus : IIngestionEventBus
{
    private const int MaxHistory = 500;
    private static readonly TimeSpan Retention = TimeSpan.FromMinutes(30);

    private readonly ConcurrentDictionary<int, RunStream> _runs = new();

    public void Publish(int runId, IngestionEventDto evt)
    {
        var stream = _runs.GetOrAdd(runId, _ => new RunStream());
        lock (stream.Gate)
        {
            stream.History.Add(evt);
            if (stream.History.Count > MaxHistory)
            {
                stream.History.RemoveAt(0);
            }

            foreach (var sub in stream.Subscribers.ToArray())
            {
                sub.Writer.TryWrite(evt);
            }

            if (IsTerminal(evt.Type))
            {
                stream.Completed = true;
                foreach (var sub in stream.Subscribers.ToArray())
                {
                    sub.Writer.TryComplete();
                }
            }
        }

        PruneExpired();
    }

    public async IAsyncEnumerable<IngestionEventDto> Subscribe(
        int runId,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var stream = _runs.GetOrAdd(runId, _ => new RunStream());
        var channel = Channel.CreateUnbounded<IngestionEventDto>(new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false,
        });

        List<IngestionEventDto> replay;
        bool alreadyDone;
        lock (stream.Gate)
        {
            replay = stream.History.ToList();
            alreadyDone = stream.Completed;
            if (!alreadyDone)
            {
                stream.Subscribers.Add(channel);
            }
        }

        try
        {
            foreach (var evt in replay)
            {
                cancellationToken.ThrowIfCancellationRequested();
                yield return evt;
            }

            if (alreadyDone || replay.Exists(e => IsTerminal(e.Type)))
            {
                yield break;
            }

            await foreach (var evt in channel.Reader.ReadAllAsync(cancellationToken))
            {
                yield return evt;
                if (IsTerminal(evt.Type))
                {
                    yield break;
                }
            }
        }
        finally
        {
            lock (stream.Gate)
            {
                stream.Subscribers.Remove(channel);
            }

            channel.Writer.TryComplete();
        }
    }

    private void PruneExpired()
    {
        var cutoff = DateTimeOffset.UtcNow - Retention;
        foreach (var (runId, stream) in _runs)
        {
            lock (stream.Gate)
            {
                if (!stream.Completed || stream.Subscribers.Count > 0)
                {
                    continue;
                }

                var last = stream.History.LastOrDefault()?.At;
                if (last is null || last < cutoff)
                {
                    _runs.TryRemove(runId, out _);
                }
            }
        }
    }

    private static bool IsTerminal(string type) =>
        type is "completed" or "error";

    private sealed class RunStream
    {
        public readonly object Gate = new();
        public readonly List<IngestionEventDto> History = new();
        public readonly List<Channel<IngestionEventDto>> Subscribers = new();
        public bool Completed;
    }
}
