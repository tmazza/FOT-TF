#include <math.h>
#define E_32 2.71828182846f

float B(int vp, int vq) {
    return powf(E_32, -1.0f * fabs(vp - vq) / 255.0f);
}

struct Histogram {
    s64  sum;
    int* hist;
};

float R(int v, Histogram hist) {
    return 1.0f - pow(E_32, -1.0f * ((float)hist.hist[v] / (float)hist.sum));
}

void calculate_histogram(u8* original, Selection* sel, int width, int height, int channels, Histogram* hist_background, Histogram* hist_foreground) {
    for(int y = 0; y < height; ++y) {
        for(int x = 0; x < height; ++x) {
            if(sel[y * width + x] == SELECTION_BACKGROUND) {
                hist_background->sum += 1;
                hist_background->hist[original[(y * channels) * width + (x * channels)]] += 1;
            }
            if(sel[y * width + x] == SELECTION_FOREGROUND) {
                hist_foreground->sum += 1;
                hist_foreground->hist[original[(y * channels) * width + (x * channels)]] += 1;
            }
        }
    }
}

void print_histogram(Histogram h) {
    printf("sum: %lld\n", h.sum);
    for(int i = 0; i < 256; ++i) {
        printf("%d: %d\n", i, h.hist[i]);
    }
    printf("\n");
}